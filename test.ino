const int swPin = 2;        // Connect the SW-420 signal pin to digital pin 2
const int buttonPin = 3;    // Connect the button pin to digital pin 3
const int signalPin = 11;
const int signal2 = 12;   // Connect the signal pin to digital pin 11
int16_t thresholdVibration = 1000; // Ngưỡng cảnh báo rung, bạn có thể điều chỉnh giá trị này
int16_t thresholdImpact = 2000;   // Ngưỡng cảnh báo va chạm, bạn có thể điều chỉnh giá trị này
unsigned long lastActivityTime = 0; // Thời điểm cuối cùng có sự thay đổi
bool sw420Active = false; // Trạng thái của SW-420
bool sleepMode = false;  // Trạng thái chế độ ngủ

int buttonState = HIGH;  // Trạng thái hiện tại của nút
int lastButtonState = HIGH;  // Trạng thái trước đó của nút

unsigned long lastPressTime = 0;  // Thời điểm cuối cùng nút được nhấn
int pressCount = 0;  // Số lần nhấn

void setup() {
  Serial.begin(9600);
  pinMode(swPin, INPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(signalPin, OUTPUT);
  pinMode(signal2, OUTPUT);
}

void loop() {
  digitalWrite(signal2, HIGH);

  int reading = digitalRead(buttonPin);

  if (reading != lastButtonState) {
    lastPressTime = millis();
  }

  if ((millis() - lastPressTime) > 50) {
    if (reading == LOW) {
      // Nếu nút được nhấn
      pressCount++;
      
      if (pressCount == 1) {
        // Nếu đây là lần nhấn thứ 2
        Serial.println("Chuyển chế độ");
        digitalWrite(signal2, LOW);
        delay(500);
        digitalWrite(signal2, HIGH);
        
        
        if (sleepMode) {
          sw420Active = false;
        }
        pressCount = 0;  // Đặt lại số lần nhấn
        sleepMode = !sleepMode;
      }
    }
  }

  lastButtonState = reading;

  // Nếu đang ở chế độ ngủ, không thực hiện bất kỳ kiểm tra nào
  if (sleepMode) {
    delay(1000);  // Delay for 1 second (adjust as needed)
  } else {
    // Đọc giá trị cảm biến rung
    int sensorValue = digitalRead(swPin);

    // Kiểm tra nếu cảm biến rung phát hiện rung động và không có sự thay đổi từ SW-420
    if (sensorValue == HIGH && !sw420Active) {
      Serial.println("Bình Thường");
      sw420Active = true; // Bật cờ cho biết SW-420 đã kích hoạt
      lastActivityTime = millis(); // Reset thời gian khi có sự thay đổi
    }

    // Kiểm tra nếu cảm biến rung phát hiện rung động và có sự thay đổi từ SW-420
    if (sw420Active && (sensorValue == HIGH)) {
      Serial.println("Bình Thường");
      // Thực hiện các hành động cần thiết khi phát hiện va chạm
      // Ví dụ: Bật cảnh báo, gửi thông báo, hoặc thực hiện một hành động cụ thể
      
      // Gửi tín hiệu ra chân D11
      digitalWrite(signalPin, LOW);
    } else {
      // Không có sự thay đổi, tắt tín hiệu ra chân D11
      digitalWrite(signalPin, HIGH);
    }

    // Kiểm tra inactivity sau mỗi 15 giây nếu không có sự thay đổi từ SW-420
    if (sw420Active && millis() - lastActivityTime > 15000) {
      Serial.println("Bị ngã");
      Serial.println("Đang gọi điện và gửi tin nhắn ...");

      // Thực hiện các hành động cần thiết khi không có sự thay đổi từ SW-420 trong 15 giây
      // Ví dụ: Bật cảnh báo, gửi thông báo, hoặc thực hiện một hành động cụ thể
      
      // Gửi tín hiệu ra chân D11
      digitalWrite(signalPin, LOW);
      
      sw420Active = false; // Tắt cờ SW-420 đã kích hoạt để chuẩn bị cho lần kích hoạt tiếp theo
    }

    // Đợi một khoảng thời gian trước khi đọc lại dữ liệu
    delay(100);
  }
}


