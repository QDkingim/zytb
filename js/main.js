    /* ===== 移动端菜单切换 ===== */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
      });
    });

    /* ===== FAQ 手风琴 ===== */
    document.querySelectorAll('.faq-item').forEach(item => {
      const btn = item.querySelector('.faq-question');
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    });

    /* ===== 表单提交（模拟） ===== */
    const form = document.getElementById('consultForm');
    const toast = document.getElementById('toast');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const province = document.getElementById('province').value;
      const score = document.getElementById('score').value;

      if (!name || !phone || !province || !score) {
        alert('请填写所有必填项（姓名、电话、省份、分数）');
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入正确的手机号码');
        return;
      }

      form.reset();
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    });

    /* ===== 导航栏滚动阴影 ===== */
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('navbar');
      nav.style.boxShadow = window.scrollY > 10
        ? '0 4px 16px rgba(0,0,0,.08)'
        : '0 1px 3px rgba(0,0,0,.08)';
    });
