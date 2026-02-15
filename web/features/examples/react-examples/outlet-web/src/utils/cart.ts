import { v4 as uuidv4 } from 'uuid';

const CART_SESSION_KEY = 'outlet_cart_session_id';

export const getCartSessionId = (): string => {
  let sessionId = localStorage.getItem(CART_SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const triggerCartUpdate = () => {
  window.dispatchEvent(new Event('cart-updated'));
};
