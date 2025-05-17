import React from "react";

const AccManagement = () => {
  return (
    <div className="container py-4">
      {/* Tổng quan */}
      <h5 className="mb-3">Tổng quan</h5>
      <div className="row border p-3 rounded bg-white">
        <div className="col-md-8">
          <div className="row">
            <div className="col-sm-6 mb-2"><strong>Tên đăng nhập:</strong> nhanvien4324</div>
            <div className="col-sm-6 mb-2"><strong>Email:</strong> ngocHieu@gmail.com</div>
            <div className="col-sm-6 mb-2"><strong>Họ và tên:</strong> Nguyễn Ngọc Hiếu</div>
            <div className="col-sm-6 mb-2"><strong>Vai trò:</strong> Nhân Viên</div>
            <div className="col-sm-6 mb-2"><strong>Số sự kiện đã tham gia:</strong> 3</div>
            <div className="col-sm-6 mb-2"><strong>Ngày tham gia:</strong> 2023-08-01</div>
          </div>
        </div>
        <div className="col-md-4 text-center">
          <img src="https://cdn-icons-png.flaticon.com/512/5231/5231019.png" alt="avatar" className="img-thumbnail rounded-circle" width="100" />
          <button className="btn btn-outline-primary btn-sm mt-2">Sửa ảnh đại diện</button>
          <small className="d-block mt-1 text-muted">Ảnh nhỏ hơn 5MB, phù hợp & không phản cảm</small>
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <h5 className="mt-4 mb-3">Thông tin cá nhân</h5>
      <div className="border p-3 rounded bg-white">
        <form>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Họ và tên</label>
              <input type="text" className="form-control" defaultValue="Trần Minh Quân" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Số điện thoại</label>
              <input type="text" className="form-control" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="text" className="form-control"  />
            </div>
            <div className="col-md-12">
              <label className="form-label">Mô tả về bạn</label>
              <textarea className="form-control" rows="3" placeholder="Chia sẻ một chút về bạn..."></textarea>
            </div>
            <div className="col-12 mt-2">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="displayNameConsent" />
                <label className="form-check-label" htmlFor="displayNameConsent">
                  Cho phép hiển thị tên của bạn trên các sự kiện
                </label>
              </div>
            </div>
            <div className="col-12 mt-3">
              <button className="btn btn-primary">Lưu thay đổi</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccManagement;