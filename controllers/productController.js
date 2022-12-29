const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cloudinary = require("cloudinary");
const WhereClause = require("../utils/whereClause");

exports.addProduct = BigPromise(async (req, res, next) => {
  //images
  let imageArr = [];
  if (!req.files) {
    return next(new CustomError("images ar mandatory", 401));
  }
  for (let index = 0; index < req.files.photos.length; index++) {
    let result = await cloudinary.v2.uploader.upload(
      req.files.photos[index].tempFilePath,
      {
        folder: "products",
      }
    );
    imageArr.push({
      id: result.public_id,
      secure_url: result.secure_url,
    });
  }

  req.body.photos = imageArr;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getFilteredProducts = BigPromise(async (req, res, next) => {
  const resultsPerPage = 6;
  const totalProductCount = await Product.countDocuments();

  const productsObj = new WhereClause(Product.find(), req.query)
    .search()
    .filter();

  let products = await productsObj.base;
  const filteredProductCount = products.length;

  productsObj.pager(resultsPerPage);
  //Mongoose no longer allows executing the same query object twice. If you do, you'll get a Query was already executed error. Executing the same query instance twice is typically indicative of mixing callbacks and promises, but if you need to execute the same query twice, you can call Query#clone() to clone the query and re-execute
  products = await productsObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    totalProductCount,
    filteredProductCount,
  });
});