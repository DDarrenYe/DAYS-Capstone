export const parseCredentials = (formData: FormData) => {
  const email = formData.get("email");
  const password = formData.get("password");
  if (
    email === null ||
    email instanceof File ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email.trim()) ||
    password === null ||
    password instanceof File ||
    email.length > 254 ||
    !password ||
    password.length > 1024
  ) {
    return null;
  }
  return { email: email.trim().toLowerCase(), password };
};
