# Đấu dây: ESP32-C3 Super Mini + MAX30100 + nút + còi (tùy chọn)

## Arduino IDE

- **Board**: chọn đúng mục cho chip **ESP32-C3** (ví dụ *ESP32C3 Dev Module* hoặc *WeAct Studio ESP32-C3 Super Mini* nếu có trong Board Manager).
- **Thư viện**: cài **Arduino-MAX30100** (GitHub: `oxullo/Arduino-MAX30100`) và **ArduinoJson** v6.
- **USB CDC**: nếu Serial không ra log, bật *USB CDC On Boot* (tùy board package).

## MAX30100 (module thường có 4–6 chân)

| Chân MAX30100 | Nối tới ESP32-C3 Super Mini | Ghi chú |
|---------------|-----------------------------|---------|
| **VIN** / **3.3V** | **3V3** | **Chỉ 3,3 V.** Không cấp 5 V trực tiếp vào module (trừ khi datasheet module ghi rõ có LDO 5 V→3,3 V). |
| **GND** | **GND** | |
| **SDA** | **GPIO8** (mặc định I2C SDA phổ biến trên C3) | Nếu board bạn in chữ **SDA** khác GPIO, hãy nối theo chân **SDA** in trên PCB và chỉnh `I2C_SDA` trong `.ino` cho khớp. |
| **SCL** | **GPIO9** (mặc định I2C SCL phổ biến trên C3) | Tương tự, chỉnh `I2C_SCL` nếu cần. |
| **INT** (nếu có) | Để trống | Sketch không dùng ngắt. |

**Lưu ý I2C:** Thư viện **oxullo/Arduino-MAX30100** bên trong gọi `Wire.begin()` không tham số. Trên ESP32, nó dùng cặp **`SDA`/`SCL` định nghĩa trong board package** (thường là 8/9 cho C3).  
- Cách đúng: **nối MAX30100 đúng hai chân I2C mà board Arduino của bạn coi là SDA/SCL mặc định**, hoặc đổi board trong Arduino IDE cho khớp.  
- Nếu bạn **bắt buộc** dùng cặp GPIO khác: xem `PATCH_MAX30100_WIRE.md` trong thư mục này (sửa 1 dòng trong thư viện).

## Nút bấm (đo 10 giây)

- **Một chân nút** → **GPIO4** (`BUTTON_PIN`)
- **Chân kia nút** → **GND**
- Trong code: `INPUT_PULLUP` → **nhấn = kéo GPIO xuống GND**.

Dùng nút **thường mở** (momentary). Nếu dùng module nút có 3 chân, chọn chân **NO + COM** tương đương (một đầu GPIO, một đầu GND).

## Còi buzzer (tùy chọn)

- **Buzzer chủ động (active)**: chân **+** → GPIO qua điện trở/transistor nếu cần; **−** → GND. Trong code dùng `digitalWrite` / `tone` tùy loại.
- **Buzzer thụ động (passive)**: cần PWM/`tone`. Sketch dùng `tone()` / `noTone()` trên `BUZZER_PIN` (mặc định **GPIO5**).

Nếu chưa có còi: đặt `BUZZER_ENABLED false` trong `.ino`.

## Cảnh báo BPM (còi)

Khi BPM sau lần đo vượt ngưỡng (trùng web: cao > 110, thấp < 55), còi kêu nhịp beep cho tới lần đo tiếp theo hoặc khi BPM vào vùng an toàn.

---

## Gợi ý kiểm tra nhanh

1. Nạp sketch, mở Serial 115200.
2. Bấm nút → Serial in “Bat dau do 10s…”.
3. Giữ ngón tay trên MAX30100 trong ~10 giây.
4. Xem log POST HTTP và trên web (BPM cập nhật qua `/bpm`).
