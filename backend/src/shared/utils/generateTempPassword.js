const generateTempPassword = () => {
  const random = Math.random().toString(36).slice(-8);

  return `Doc@${random}`;
};

export default generateTempPassword;