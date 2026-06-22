Hệ thống website của nhóm được xây dựng theo mô hình Client – Server, trong đó phía Client chịu trách nhiệm hiển thị giao diện và tương tác với người dùng, còn phía Server đảm nhiệm xử lý nghiệp vụ, truy xuất dữ liệu và trả kết quả về cho Client. Kiến trúc này giúp tách biệt rõ ràng giữa giao diện và xử lý dữ liệu, từ đó tăng tính bảo trì, mở rộng và nâng cấp hệ thống.

Khi người dùng gửi một yêu cầu thông qua trình duyệt, ví dụ truy cập đường dẫn /songs/detail/5, yêu cầu HTTP sẽ được chuyển đến Routing Middleware. Thành phần này có nhiệm vụ phân tích URL và xác định Controller cũng như Action tương ứng cần thực thi. Trong trường hợp này, yêu cầu được chuyển đến phương thức Detail(id = 5) của SongsController.

Tiếp theo, Controller sẽ gọi các dịch vụ xử lý dữ liệu thông qua Entity Framework Core. Công nghệ này đóng vai trò trung gian giữa ứng dụng và cơ sở dữ liệu SQL Server, giúp thực hiện các truy vấn dữ liệu mà không cần viết trực tiếp câu lệnh SQL phức tạp. Sau khi lấy dữ liệu thành công, hệ thống tạo ra một đối tượng Model chứa thông tin bài hát như tiêu đề, ca sĩ và các thuộc tính liên quan.

Cuối cùng, dữ liệu từ Model được truyền sang View (Razor .cshtml) để kết hợp với giao diện HTML và sinh ra nội dung hoàn chỉnh gửi về trình duyệt dưới dạng HTTP Response (HTML hoặc JSON). Quy trình này đảm bảo việc xử lý dữ liệu và hiển thị giao diện được tách biệt, giúp hệ thống hoạt động hiệu quả và dễ quản lý hơn.
<img width="458" height="382" alt="image" src="https://github.com/user-attachments/assets/94ec58ca-a71f-4e8e-b978-d9d804ea38de" />
