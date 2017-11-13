export function formatTo2Digits(n) {
  if (n < 10) {
    return '0' + n;
  }
  else {
    return '' + n;
  }
}
