const users = [
  { name: "叶孤", avatar: "./assets/1.png" },  // 或 "assets/1.png"
  { name: "萧峰", avatar: "./assets/2.png" },  // 或 "assets/2.png"
  { name: "虚竹", avatar: "./assets/3.png" }   // 或 "assets/3.png"
];

  // 获取DOM元素
  const canvas = document.getElementById("table");
  const ctx = canvas.getContext("2d");
  const rollBtn = document.getElementById("roll-btn") || document.querySelector("button");
  const winnerDiv = document.getElementById("winner");
  const winnerImg = document.getElementById("winner-avatar");
  const winnerName = document.getElementById("winner-name");
  const closeBtn = document.querySelector(".close-btn");
  
  // 设置Canvas高分辨率渲染
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = 500;
  const displayHeight = 500;
  
  // 设置为屏幕的像素比以获得高清显示
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  ctx.scale(dpr, dpr);
  
  // 基础参数
  const centerX = displayWidth / 2;
  const centerY = displayHeight / 2 - 20; // 把整个圆桌向上移20像素，为底部称呼留出空间
  const tableRadius = 110;  // 适当的桌子尺寸
  const avatarSize = 60;    // 头像尺寸
  const orbitRadius = 160;  // 头像到中心的距离
  
  // 加载图片 - 增加错误处理
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.error(`无法加载图片: ${src}`);
        // 加载失败时使用占位图
        const fallbackImg = new Image();
        fallbackImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="%23cccccc"/><text x="25" y="30" font-size="12" text-anchor="middle" fill="%23333333">无图片</text></svg>';
        resolve(fallbackImg);
      };
      // 设置crossOrigin以处理可能的跨域问题
      img.src = src;
    });
  }
  
  // 预加载所有头像
  async function preloadImages() {
    const images = {};
    for (const user of users) {
      images[user.name] = await loadImage(user.avatar);
    }
    return images;
  }
  
  // 绘制桌子和头像
  function drawTable(images, highlightIndex = -1) {
    // 清空画布
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // 画桌子的阴影
    ctx.beginPath();
    ctx.arc(centerX, centerY + 5, tableRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    
    // 画圆桌
    ctx.beginPath();
    ctx.arc(centerX, centerY, tableRadius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      centerX, centerY, tableRadius * 0.7,
      centerX, centerY, tableRadius
    );
    gradient.addColorStop(0, '#c8a45d');
    gradient.addColorStop(1, '#9c7c38');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 添加木纹纹理效果
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for(let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, tableRadius * (0.3 + i * 0.1), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(100, 70, 30, ${0.03 + i * 0.01})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
    
    // 绘制用户头像和名称 - 调整位置以确保完全显示
    users.forEach((user, index) => {
      // 计算头像位置 - 从12点位置开始，均匀分布
      const angle = (index * (360 / users.length) - 90) * Math.PI / 180;
      const x = centerX + orbitRadius * Math.cos(angle);
      const y = centerY + orbitRadius * Math.sin(angle);
      
      // 特殊处理12点位置的文字，向上调整位置
      const textYOffset = index === 0 ? -avatarSize/2 - 10 : avatarSize/2 + 15;
      const textBaseline = index === 0 ? 'bottom' : 'top';
      
      // 如果是高亮头像，先画发光效果
      if (index === highlightIndex) {
        // 绘制多层光晕效果
        for (let i = 12; i > 0; i -= 3) {
          ctx.beginPath();
          ctx.arc(x, y, avatarSize/2 + i, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + (12-i)*0.03})`;
          ctx.fill();
        }
      }
      
      // 画头像边框
      ctx.beginPath();
      ctx.arc(x, y, avatarSize/2, 0, Math.PI * 2);
      ctx.fillStyle = '#f5f0e1';
      ctx.fill();
      ctx.strokeStyle = index === highlightIndex ? '#ffcc00' : '#9c7c38';
      ctx.lineWidth = index === highlightIndex ? 3 : 2;
      ctx.stroke();
      
      // 绘制头像图片 - 采用高质量绘制
      if (images && images[user.name]) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, avatarSize/2 - 2, 0, Math.PI * 2);
        ctx.clip();
        
        // 使用更高质量的图像渲染设置
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        ctx.drawImage(
          images[user.name],
          x - avatarSize/2 + 2,
          y - avatarSize/2 + 2,
          avatarSize - 4,
          avatarSize - 4
        );
        ctx.restore();
      }
      
      // 写名字 - 确保文字完全显示
      ctx.font = 'bold 16px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = textBaseline;
      
      // 文字描边，增强可读性
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(245, 240, 225, 0.8)';
      ctx.strokeText(user.name, x, y + textYOffset);
      
      // 文字填充
      ctx.fillStyle = '#333';
      ctx.fillText(user.name, x, y + textYOffset);
    });
  }
  
  // 加载图片并初始渲染
  let loadedImages = null;
  preloadImages().then(images => {
    loadedImages = images;
    drawTable(images);
  });
  
// 按钮点击事件
let isAnimating = false;
if (rollBtn) {
  rollBtn.addEventListener("click", () => {
    if (isAnimating) return;
    isAnimating = true;
    
    // 动画总时长基准为6秒，加入小幅随机变化
    const animationDuration = 5800 + Math.random() * 400; // 5.8-6.2秒
    const startTime = Date.now();
    
    // 随机初始索引，增加随机性
    let index = Math.floor(Math.random() * users.length);
    
    // 速度参数
    const minInterval = 40;   // 开始时最快(毫秒)
    const maxInterval = 600;  // 结束时最慢(毫秒)
    
    // 预先计算总循环次数(模糊值)，确保结尾随机
    const estimatedTotalSteps = Math.floor(animationDuration / 120); // 粗略估计
    const randomExtraSteps = Math.floor(Math.random() * users.length * 2); // 随机额外步数
    const targetTotalSteps = estimatedTotalSteps + randomExtraSteps;
    
    let steps = 0;
    
    function highlightNext() {
      // 计算已经过去的时间比例
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // 高亮当前选中的用户
      drawTable(loadedImages, index);
      
      // 递增步数并更新索引
      steps++;
      index = (index + 1) % users.length;
      
      // 缓动函数 - 让减速更加自然
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      const easedProgress = easeOutQuart(progress);
      
      // 计算下一个间隔
      const nextInterval = minInterval + (maxInterval - minInterval) * easedProgress;
      
      // 判断是否继续动画
      if (progress < 1) {
        setTimeout(highlightNext, nextInterval);
      } else {
        // 动画结束，当前索引的前一个就是最终位置
        const finalIndex = (index - 1 + users.length) % users.length;
        drawTable(loadedImages, finalIndex);
        
        // 闪烁效果强调获胜者
        flashFinalWinner(finalIndex, 0);
      }
    }
    
    // 最终选中的头像闪烁几次后显示弹窗
    function flashFinalWinner(winnerIndex, flashCount) {
      if (flashCount >= 5) {
        // 闪烁结束后显示弹窗
        showWinner(winnerIndex);
        isAnimating = false;
        return;
      }
      
      // 闪烁效果
      if (flashCount % 2 === 0) {
        drawTable(loadedImages, winnerIndex);
      } else {
        drawTable(loadedImages, -1);
      }
      
      setTimeout(() => flashFinalWinner(winnerIndex, flashCount + 1), 150);
    }
    
    // 开始动画
    highlightNext();
  });
}

  
  // 显示获胜者
  function showWinner(index) {
    const winner = users[index];
    
    // 设置弹窗内容
    if (winnerImg) winnerImg.src = winner.avatar;
    if (winnerName) winnerName.textContent = winner.name;
    
    // 显示弹窗
    if (winnerDiv) {
      winnerDiv.style.display = "flex";
      winnerDiv.classList.remove('hidden');
      setTimeout(() => {
        winnerDiv.classList.add('visible');
      }, 10);
    }
  }
  
  // 关闭获胜者显示
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      winnerDiv.classList.remove('visible');
      setTimeout(() => {
        winnerDiv.classList.add('hidden');
        winnerDiv.style.display = "none";
        // 关闭后重绘原始状态
        drawTable(loadedImages);
      }, 500);
    });
  } else if (winnerDiv) {
    winnerDiv.addEventListener('click', () => {
      winnerDiv.style.display = "none";
      // 关闭后重绘原始状态
      drawTable(loadedImages);
    });
  }
  