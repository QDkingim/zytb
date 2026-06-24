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

    /* ===== 表单提交 ===== */
    const form = document.getElementById('consultForm');
    const toast = document.getElementById('toast');
    const submitBtn = form.querySelector('.form-submit');

    function showToast(message, isError) {
      toast.textContent = message;
      toast.classList.toggle('toast-error', !!isError);
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show', 'toast-error');
        toast.textContent = '✓ 提交成功，稍后联系您';
      }, 3500);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        province: document.getElementById('province').value,
        score: document.getElementById('score').value,
        rank: document.getElementById('rank').value.trim(),
        subject: document.getElementById('subject').value,
        interest: document.getElementById('interest').value.trim(),
        remark: document.getElementById('remark').value.trim(),
      };

      if (!payload.name || !payload.phone || !payload.province || !payload.score) {
        alert('请填写所有必填项（姓名、电话、省份、分数）');
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(payload.phone)) {
        alert('请输入正确的手机号码');
        return;
      }

      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          showToast(data.message || '提交失败，请稍后重试', true);
          return;
        }

        form.reset();
        showToast('✓ ' + (data.message || '提交成功，稍后联系您'), false);
      } catch {
        showToast('网络错误，请检查连接后重试', true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    /* ===== 导航栏滚动阴影 ===== */
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('navbar');
      nav.style.boxShadow = window.scrollY > 10
        ? '0 4px 16px rgba(0,0,0,.08)'
        : '0 1px 3px rgba(0,0,0,.08)';
    });
