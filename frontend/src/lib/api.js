const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

let csrfToken = '';

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!csrfToken) {
      const csrfResponse = await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' });
      const csrfData = await csrfResponse.json().catch(() => ({}));
      if (!csrfResponse.ok || !csrfData.csrfToken) {
        throw new Error(csrfData.error || 'Could not initialize a secure session.');
      }
      csrfToken = csrfData.csrfToken;
    }
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));

  if (data.csrfToken) {
    csrfToken = data.csrfToken;
  }
  if (!response.ok) {
    if (response.status === 403 && /session expired/i.test(data.error || '')) {
      csrfToken = '';
    }
    throw new Error(data.error || `Request failed (${response.status}).`);
  }

  return data;
}

export function getCurrentUser() {
  return request('/auth/me');
}

export function registerStudent(payload) {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function loginStudent(payload) {
  return request('/auth/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function loginAdmin(payload) {
  return request('/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  const result = await request('/auth/logout', { method: 'POST' });
  csrfToken = '';
  return result;
}

export function getMyAttempts() {
  return request('/auth/attempts');
}

export function submitExam(payload) {
  return request('/submit-exam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function submitQuestionReport(payload) {
  return request('/question-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getAdminUsers() {
  return request('/admin/users');
}

export function updateStudentStatus(userId, status) {
  return request(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function updateStudentExamAccess(userId, examIds) {
  return request(`/admin/users/${encodeURIComponent(userId)}/access`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examIds }),
  });
}

export function getAdminAttempts() {
  return request('/admin/attempts');
}

export function overrideAttemptScore(attemptId, score, reason) {
  return request(`/admin/attempts/${encodeURIComponent(attemptId)}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, reason }),
  });
}

export function getAdminQuestionReports() {
  return request('/admin/question-reports');
}
