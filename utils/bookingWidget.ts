// Reusable booking widget utility
export const openBookingWidget = () => {
  // Ensure we're running in the browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Check if modal already exists
  if (document.getElementById('booking-modal')) {
    return;
  }

  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'booking-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    overflow: hidden;
    position: relative;
  `;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    z-index: 10000;
    color: #666;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://api.khamareclarke.com/widget/booking/C3V3xCg4c0WkU16zh5Xf';
  iframe.style.cssText = `
    width: 100%;
    height: 600px;
    border: none;
    overflow: hidden;
  `;
  iframe.scrolling = 'no';
  iframe.id = 'C3V3xCg4c0WkU16zh5Xf_' + Date.now();
  
  // Assemble modal
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(iframe);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Load the booking script
  if (!document.querySelector('script[src="https://api.khamareclarke.com/js/form_embed.js"]')) {
    const script = document.createElement('script');
    script.src = 'https://api.khamareclarke.com/js/form_embed.js';
    script.type = 'text/javascript';
    document.head.appendChild(script);
  }
  
  // Close modal handlers
  const closeModal = () => {
    const existingModal = document.getElementById('booking-modal');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e: MouseEvent) => {
    if (e.target === modal) closeModal();
  });
  
  // ESC key to close
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
};
