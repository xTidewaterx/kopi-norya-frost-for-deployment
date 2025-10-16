"use client";

import { useState, useEffect } from "react";
import { storage } from "../../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuid } from "uuid";
require("dotenv").config();
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useAuth } from "../auth/authContext";

export default function PostProduct(productValue) {
  const paramsId = useParams().id;
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const router = useRouter();
  const { user } = useAuth(); // ✅ Get current logged-in user

  const [product, setProduct] = useState({
    name: productValue?.currentProduct?.name || "",
    description: productValue?.currentProduct?.description || "",
    price: productValue?.currentProduct?.price || "",
    images: productValue?.currentProduct?.images || [],
    id: "",
  });

  const [updateProduct, setUpdateProduct] = useState({
    name: productValue?.currentProduct?.name || "",
    description: productValue?.currentProduct?.description || "",
    price: productValue?.currentProduct?.price || "",
    images: [],
    id: "",
  });

  const [deletedProduct, setDeletedProduct] = useState({});
  const [newFiles, setNewFiles] = useState([]);
  const [uploadedUrlsArray, setUploadedUrlsArray] = useState([]);
  const [productId, setProductId] = useState([]);
  const [files, setFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [uploadNow, setUploadNow] = useState(false);

  // ✅ New: track successful upload for new products
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // for fade in/out

  useEffect(() => {
    setProduct((prev) => ({ ...prev, id: paramsId }));
    setUpdateProduct((prev) => ({ ...prev, id: paramsId }));
  }, [paramsId]);

  const getStoragePathFromUrl = (url) => {
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/";
    if (url.includes(baseUrl)) {
      return decodeURIComponent(url.split(baseUrl)[1].split("?")[0]);
    }
    return null;
  };

  const uploadFilesToFirebase = async () => {
    if (deletedFiles.deletedFiles?.length > 0) {
      const deletePromises = deletedFiles.deletedFiles.map(async (file) => {
        try {
          const imagePath = getStoragePathFromUrl(file.image);
          if (!imagePath) throw new Error("Invalid Firebase image URL");
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      });
      await Promise.all(deletePromises);
    }

    const uploadPromises = files.map(async (file) => {
      const imageRef = ref(storage, `products/${uuid()}`);
      try {
        const snapshot = await uploadBytes(imageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
      } catch (error) {
        console.error("Upload error:", error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const validResults = results.filter((url) => url);

    setUploadedUrlsArray(validResults);

    setProduct((prev) => ({
      ...prev,
      images: [
        ...(prev.images || []).filter((url) => !url.startsWith("blob:")),
        ...validResults,
      ],
    }));

    setFiles([]);
  };

  const uploadFilesToStripe = async () => {
    const realImages = [
      ...(product.images || []).filter(
        (url) => !url.startsWith("blob:") && !uploadedUrlsArray.includes(url)
      ),
      ...uploadedUrlsArray,
    ];

    const endpoint =
      editParam === "true" ? "/api/products/updateProduct" : "/api/products";

    // ✅ Include user info as metadata
    const creatorData = {
      creatorId: user?.uid || "anonymous",
      creatorEmail: user?.email || "unknown",
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...product,
        images: realImages,
        metadata: creatorData, // ✅ Pass to API
      }),
    });

    const data = await res.json();
    setProductId(data.id);

    setProduct((prev) => ({
      ...prev,
      images: realImages,
    }));

    setUploadedUrlsArray([]);

    if (editParam === "true") {
      router.replace(`/products/${paramsId}`);
    } else {
      // ✅ Only for new product: show fade-in/out success circle and reset form
      setUploadSuccess(true);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1800);
      setTimeout(() => {
        setUploadSuccess(false);
        setProduct({
          name: "",
          description: "",
          price: "",
          images: [],
          id: "",
        });
        setFiles([]);
        setDeletedFiles([]);
        setUpdateProduct({
          name: "",
          description: "",
          price: "",
          images: [],
          id: "",
        });
      }, 2000);
    }
  };

  useEffect(() => {
    if (uploadedUrlsArray.length > 0) {
      uploadFilesToStripe();
    }
  }, [uploadedUrlsArray]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files?.length !== 0 || deletedFiles?.deletedFiles?.length > 0) {
      await uploadFilesToFirebase();
      if (files?.length === 0 && deletedFiles?.deletedFiles?.length > 0) {
        await uploadFilesToStripe();
      }
    } else {
      uploadFilesToStripe();
    }
  };

  const onChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

      const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
      setProduct((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...previewUrls],
      }));
    }
  };

  const removeImage = ({ image, index }) => {
    setDeletedFiles((prevFiles) => {
      const deletedFilesArray = prevFiles?.deletedFiles ?? [];
      return {
        ...prevFiles,
        deletedFiles: [...deletedFilesArray, { image }],
      };
    });

    setProduct((prevProduct) => ({
      ...prevProduct,
      images: (prevProduct.images || []).filter((_, i) => i !== index),
    }));

    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* ✅ Success Indicator with Fade In/Out */}
      {uploadSuccess && (
        <div
          className={`fixed top-4 right-4 flex items-center space-x-2 z-50 transition-opacity duration-500 ${
            showSuccess ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#001F54] animate-pulse"></div>
          <span className="text-[#001F54] font-semibold">Product uploaded</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl w-full mx-auto bg-white p-8 rounded-xl shadow-md"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {productValue?.currentProduct ? "Edit Product" : "Add New Product"}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter product name"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Write a short description"
              value={product.description}
              onChange={(e) =>
                setProduct({ ...product, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="text"
              name="price"
              placeholder="e.g. 199.99"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Images
            </label>
            <input
              type="file"
              name="image"
              onChange={onChange}
              multiple
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">
              Product Images
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border border-gray-200 rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {product?.images?.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Product ${index}`}
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeImage({ image, index });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition duration-300"
          >
            {productValue?.currentProduct ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </>
  );
}
