# Đẩy code lên repository mới tên `hackathon`

Mình không thể đăng nhập GitHub/GitLab thay bạn. Làm lần lượt trên máy bạn (PowerShell), trong thư mục `heart_monitor_system`:

## 1) Khởi tạo Git và commit

```powershell
cd "c:\Users\ironc\Desktop\Test py\heart_monitor_system"
git init -b main
git add -A
git status
```

Kiểm tra: **không** thấy `backend/.env` trong danh sách (đã có trong `.gitignore`).

```powershell
git commit -m "Initial commit: AIoT heart monitor (hackathon)"
```

Nếu Git báo thiếu tên/email:

```powershell
git config user.email "you@example.com"
git config user.name "Your Name"
```

## 2) Tạo repo trống trên GitHub

1. Vào GitHub → **New repository**  
2. **Repository name:** `hackathon`  
3. **Không** tích “Add README” (đã có code local)  
4. Tạo repo → copy URL HTTPS, ví dụ: `https://github.com/<USERNAME>/hackathon.git`

## 3) Nối remote và push

```powershell
git remote add origin https://github.com/<USERNAME>/hackathon.git
git push -u origin main
```

Đăng nhập GitHub khi được hỏi (Personal Access Token nếu dùng HTTPS).

## GitLab / Bitbucket

Tạo project tên `hackathon`, rồi:

```powershell
git remote add origin https://gitlab.com/<USER>/hackathon.git
git push -u origin main
```

---

**Lưu ý:** File `backend/.env` (chứa API key) **không** được commit. Người clone repo cần copy từ `backend/.env.example` và điền giá trị riêng.
