import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m', target: 20 },  // stay at 20 users
    { duration: '30s', target: 0 },  // ramp down
  ],
};

const BASE_URL = 'http://localhost:8080/api/v1';
const TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  let params = {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `key-${Math.random()}`,
    },
  };

  // 1. Create Order
  let payload = JSON.stringify({
    items: [{ sku: 'IPHONE15', qty: 1 }]
  });
  let res = http.post(`${BASE_URL}/orders`, payload, params);
  check(res, { 'status is 200': (r) => r.status === 200 });

  let orderId = res.json().id;

  // 2. Get Order
  res = http.get(`${BASE_URL}/orders/${orderId}`, params);
  check(res, { 'get order is 200': (r) => r.status === 200 });

  sleep(1);
}
