
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <math.h>

#include "MAX30100_PulseOximeter.h"




#define I2C_SDA 8
#define I2C_SCL 9


#define BUTTON_PIN 4


#define BUZZER_ENABLED true
#define BUZZER_PIN 5



const char *WIFI_SSID = "Nguyen";
const char *WIFI_PASS = "Nguyen2004";

const char *API_BASE_URL = "http://192.168.1.194:8000";
const char *API_KEY = "change-me-in-production";
const char *DEVICE_ID = "esp32-c3-max30100";


const unsigned long MEASURE_MS = 10000;
const unsigned long HR_SAMPLE_INTERVAL_MS = 200;


#define HIGH_BPM_THRESHOLD 110
#define LOW_BPM_THRESHOLD 55
#define ALARM_BEEP_ON_MS 250
#define ALARM_BEEP_OFF_MS 750
#define ALARM_FREQ_HIGH_HZ 2000
#define ALARM_FREQ_LOW_HZ 1500

PulseOximeter pox;

enum MeasureState { ST_IDLE, ST_MEASURING };
MeasureState g_state = ST_IDLE;
unsigned long g_measureStart = 0;
unsigned long g_hrSampleLast = 0;
float g_hrSum = 0.0f;
unsigned g_hrCount = 0;

int g_lastPostedBpm = 0;
bool g_havePosted = false;

#if BUZZER_ENABLED
unsigned long g_alarmLastToggleMs = 0;
bool g_alarmOn = false;
int g_alarmFreq = 0;

void buzzerOff() {
  noTone(BUZZER_PIN);
  g_alarmOn = false;
}

void updateAlarm(int bpm) {
  const bool high = bpm > HIGH_BPM_THRESHOLD;
  const bool low = (bpm > 0) && (bpm < LOW_BPM_THRESHOLD);
  const bool active = high || low;

  if (!active) {
    buzzerOff();
    g_alarmFreq = 0;
    return;
  }

  const int freq = high ? ALARM_FREQ_HIGH_HZ : ALARM_FREQ_LOW_HZ;
  if (freq != g_alarmFreq) {
    g_alarmFreq = freq;
    g_alarmLastToggleMs = millis();
    buzzerOff();
  }

  unsigned long now = millis();
  unsigned long interval = g_alarmOn ? ALARM_BEEP_OFF_MS : ALARM_BEEP_ON_MS;
  if (now - g_alarmLastToggleMs >= interval) {
    g_alarmLastToggleMs = now;
    g_alarmOn = !g_alarmOn;
    if (g_alarmOn) {
      tone(BUZZER_PIN, freq);
    } else {
      noTone(BUZZER_PIN);
    }
  }
}
#endif

bool connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Dang ket noi WiFi");
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("OK IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  Serial.println("Loi WiFi!");
  return false;
}

bool postBpm(int bpm, const char *rawNote) {
  if (WiFi.status() != WL_CONNECTED) {
    if (!connectWifi()) return false;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/v1/heart-rate";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  StaticJsonDocument<256> doc;
  doc["bpm"] = bpm;
  doc["device_id"] = DEVICE_ID;
  doc["sensor"] = "max30100";
  if (rawNote != nullptr && rawNote[0] != '\0') {
    doc["raw_note"] = rawNote;
  }

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.printf("POST %s -> HTTP %d\n", url.c_str(), code);
  if (code > 0) {
    Serial.println(http.getString());
  }
  http.end();
  return code >= 200 && code < 300;
}

static bool consumeButtonPress() {
  static bool lastRaw = true;
  static unsigned long debounceAt = 0;
  static bool armed = true;

  bool raw = digitalRead(BUTTON_PIN);  
  unsigned long now = millis();

  if (raw != lastRaw) {
    debounceAt = now;
    lastRaw = raw;
  }

  if (now - debounceAt < 45) {
    return false;
  }

  if (raw == false && armed) {
    armed = false;
    return true;
  }
  if (raw == true) {
    armed = true;
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(BUTTON_PIN, INPUT_PULLUP);

#if BUZZER_ENABLED
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
#endif

  
  
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(400000);

  Serial.println("Khoi tao MAX30100...");
  if (!pox.begin()) {
    Serial.println("MAX30100: begin() THAT BAI. Kiem tra day 3V3/GND/SDA/SCL va dia chi I2C.");
    Serial.println("Doc WIRING.md; neu can SDA/SCL tuy chinh, xem PATCH_MAX30100_WIRE.md");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("MAX30100 OK. Nhan nut de do 10s.");
  connectWifi();
}

void loop() {
  if (g_state == ST_IDLE) {
    if (consumeButtonPress()) {
      g_state = ST_MEASURING;
      g_measureStart = millis();
      g_hrSampleLast = 0;
      g_hrSum = 0.0f;
      g_hrCount = 0;
      Serial.println("Bat dau do 10s â€” dat ngon tay len cam bien, giu yen.");
#if BUZZER_ENABLED
      tone(BUZZER_PIN, 880, 120);
#endif
    }

    pox.update();
#if BUZZER_ENABLED
    updateAlarm(g_havePosted ? g_lastPostedBpm : 0);
#endif
    return;
  }

  
  pox.update();

  unsigned long now = millis();
  if (now - g_hrSampleLast >= HR_SAMPLE_INTERVAL_MS) {
    g_hrSampleLast = now;
    float hr = pox.getHeartRate();
    if (isfinite(hr) && hr > 40.0f && hr < 220.0f) {
      g_hrSum += hr;
      g_hrCount++;
    }
  }

  if (now - g_measureStart >= MEASURE_MS) {
    int bpm = 0;
    if (g_hrCount > 0) {
      bpm = (int)lroundf(g_hrSum / (float)g_hrCount);
      bpm = constrain(bpm, 0, 300);
    }

    char note[96];
    snprintf(note, sizeof(note), "max30100_10s_btn samples=%u", g_hrCount);

    Serial.printf("Ket thuc do: BPM=%d (%u mau hop le)\n", bpm, g_hrCount);
    bool ok = postBpm(bpm, note);
    g_lastPostedBpm = bpm;
    g_havePosted = true;

#if BUZZER_ENABLED
    if (ok && bpm > 0) {
      tone(BUZZER_PIN, 1200, 200);
    } else {
      tone(BUZZER_PIN, 400, 400);
    }
#endif

    g_state = ST_IDLE;
    Serial.println("San sang â€” nhan nut de do lai.");
  }
}
