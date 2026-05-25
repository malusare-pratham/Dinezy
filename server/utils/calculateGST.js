const calculateGST = (
  amount,
  gstPercentage = 5
) => {

  /*
  GST CALCULATION
  */

  const gstAmount =

    (amount * gstPercentage) / 100;

  /*
  ROUND VALUE
  */

  return Number(
    gstAmount.toFixed(2)
  );

};

export {
  calculateGST
};