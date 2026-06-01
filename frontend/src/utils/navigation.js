let navigator = null;

export const setNavigator = (navigateFunction) => {
  navigator = navigateFunction;
};

export const navigateTo = (path, options = {}) => {
  if (navigator) {
    navigator(path, options);
    return;
  }

  window.location.assign(path);
};