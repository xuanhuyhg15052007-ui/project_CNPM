Luồng chi tiết từng bước: GET /songs/detail/5 → Routing middleware khớp route → Controller nhận request → gọi EF Core truy vấn SQL Server → lấy về Model (C# object) → đổ vào View (Razor .cshtml) → render HTML trả về browser
<img width="458" height="382" alt="image" src="https://github.com/user-attachments/assets/94ec58ca-a71f-4e8e-b978-d9d804ea38de" />
