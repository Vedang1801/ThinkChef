import "./init";
/*import "../App.css";*/
import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";

import React, { useState, useEffect } from "react";
import AWS from "aws-sdk";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useAuth } from "./authContext";

const AddRecipe = () => {
  const [recipeData, setRecipeData] = useState({
    title: "",
    description: "",
    Instructions: "",
    ingredients: [{ item: "", quantity: "" }],
    image: "",
  });

  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setRecipeData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  useEffect(() => {
    if (!loggedIn) {
      navigate("/login"); // Redirect to login if user is not logged in
    }
  });

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...recipeData.ingredients];
    newIngredients[index][field] = value;
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };

  const handleDeleteIngredient = (index) => {
    const newIngredients = [...recipeData.ingredients];
    newIngredients.splice(index, 1);
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };

  const handleAddMoreIngredients = () => {
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: [...prevState.ingredients, { item: "", quantity: "" }],
    }));
  };

  const handleImageChange = (e: any) => {
    setRecipeData((prevState) => ({
      ...prevState,
      image: e.target.files[0],
    }));
    console.log(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loggedIn) {
      navigate("/login"); // Redirect to login if user is not logged in
      return;
    }
    if (!recipeData.image) {
      toast.error("Image Not Uploaded");
      return;
    }

    if (
      !recipeData.title ||
      !recipeData.description ||
      !recipeData.Instructions ||
      recipeData.ingredients.some(
        (ingredient) => !ingredient.item || !ingredient.quantity
      )
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const requestData = {
        title: recipeData.title,
        description: recipeData.description,
        user_id: Cookies.get("user_id"),
        image: recipeData.image,
        Instructions: recipeData.Instructions,
        ingredients: recipeData.ingredients,
      };

      const response = await fetch("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        console.log("Recipe created successfully");
        toast.success("Recipe created successfully");
        navigate("/");
        // Optionally reset form state here
      } else {
        console.error("Error creating recipe client");
        console.log(requestData);
        toast.error("Error creating recipe client");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error?.response.data);
    }
  };

// Update your frontend code to call the new API endpoint
const handleAddImageClick = async () => {
  try {
    if (!recipeData.image) {
      toast.error("Image Not Uploaded");
      return;
    }

    const formData = new FormData();
    formData.append("image", recipeData.image);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log("File uploaded successfully:", responseData.imageUrl);
      toast.success("File uploaded successfully");

      setRecipeData((prevState) => ({
        ...prevState,
        image: responseData.imageUrl,
      }));
    } else {
      console.error("Error uploading file");
      toast.error("Error uploading file");
    }
  } catch (error) {
    console.error("Error:", error);
    toast.error("Error uploading file");
  }
};


  return (
    <div className="home-container">
      <div className="home-background"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="centered-container">
          <div className="recipes-box">
            <h2 className="addrecipeboxtitle">ADD RECIPE</h2>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="title"
            >
              Title:
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="title"
              name="title"
              type="text"
              placeholder="Enter title"
              value={recipeData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="description"
            >
              Description:
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="description"
              name="description"
              placeholder="Enter description"
              value={recipeData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="Instructions"
            >
              Instruction:
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="Instructions"
              name="Instructions"
              placeholder="Enter Instructions"
              value={recipeData.Instructions}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="ingredients"
            >
              Ingredients:
            </label>
            {recipeData.ingredients.map((ingredient, index) => (
              <div key={index} className="mb-2 flex items-center">
                <input
                  className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  type="text"
                  placeholder={`Ingredient ${index + 1}`}
                  value={ingredient.item}
                  onChange={(e) =>
                    handleIngredientChange(index, "item", e.target.value)
                  }
                  required
                />
                <input
                  className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  type="text"
                  placeholder={`Quantity ${index + 1}`}
                  value={ingredient.quantity}
                  onChange={(e) =>
                    handleIngredientChange(index, "quantity", e.target.value)
                  }
                  required
                />
                <button
                  className="bin-button"
                  onClick={() => handleDeleteIngredient(index)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 39 7"
                    className="bin-top"
                  >
                    <line
                      strokeWidth="4"
                      stroke="white"
                      y2="5"
                      x2="39"
                      y1="5"
                    ></line>
                    <line
                      strokeWidth="3"
                      stroke="white"
                      y2="1.5"
                      x2="26.0357"
                      y1="1.5"
                      x1="12"
                    ></line>
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 33 39"
                    className="bin-bottom"
                  >
                    <mask fill="white" id="path-1-inside-1_8_19">
                      <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
                    </mask>
                    <path
                      mask="url(#path-1-inside-1_8_19)"
                      fill="white"
                      d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                    ></path>
                    <path strokeWidth="4" stroke="white" d="M12 6L12 29"></path>
                    <path strokeWidth="4" stroke="white" d="M21 6V29"></path>
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 89 80"
                    className="garbage"
                  >
                    <path
                      fill="white"
                      d="M20.5 10.5L37.5 15.5L42.5 11.5L51.5 12.5L68.75 0L72 11.5L79.5 12.5H88.5L87 22L68.75 31.5L75.5066 25L86 26L87 35.5L77.5 48L70.5 49.5L80 50L77.5 71.5L63.5 58.5L53.5 68.5L65.5 70.5L45.5 73L35.5 79.5L28 67L16 63L12 51.5L0 48L16 25L22.5 17L20.5 10.5Z"
                    ></path>
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleAddMoreIngredients}
            >
              Add More
            </button>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="image"
            >
              Image:
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
              type="button"
              onClick={handleAddImageClick}
            >
              Add Image
            </button>
          </div>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRecipe;
