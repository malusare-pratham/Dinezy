const generateBillNumber = () => {

  /*
  DATE
  */

  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2,'0');

  const day =
    String(
      date.getDate()
    ).padStart(2,'0');

  /*
  RANDOM NUMBER
  */

  const random =
    Math.floor(

      1000 +

      Math.random() * 9000

    );

  /*
  FINAL BILL NUMBER
  */

  return `BILL-${year}${month}${day}-${random}`;

};

export {
  generateBillNumber
};