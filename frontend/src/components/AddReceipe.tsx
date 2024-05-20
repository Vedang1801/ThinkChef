import './init'
import React, { useState,useEffect } from 'react';
import AWS from 'aws-sdk'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { useAuth } from './authContext'; 

const AddRecipe = () => {
  const [recipeData, setRecipeData] = useState({
    title: '',
    description: '',
    Instructions:'',
    ingredients: [{ item: '', quantity: '' }],
    image: ''
  });

  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setRecipeData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  useEffect(()=>{
    if (!loggedIn) {
      navigate('/login'); // Redirect to login if user is not logged in
    } 
  })

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...recipeData.ingredients];
    newIngredients[index][field] = value;
    setRecipeData(prevState => ({
      ...prevState,
      ingredients: newIngredients
    }));
  };


const handleAddMoreIngredients = () => {
  setRecipeData(prevState => ({
    ...prevState,
    ingredients: [...prevState.ingredients, { item: '', quantity: '' }]
  }));
};

  const handleImageChange = (e:any) => {
    setRecipeData(prevState => ({
      ...prevState,
      image: e.target.files[0]
    }));
    console.log(e.target.files[0])
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
if (!loggedIn) {
      navigate('/login'); // Redirect to login if user is not logged in
      return;
    }
    if (!recipeData.image) {
      toast.error('Image Not Uploaded');
      return;
    }

    if (!recipeData.title || !recipeData.description || !recipeData.Instructions || recipeData.ingredients.some((ingredient) => !ingredient.item || !ingredient.quantity)) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const requestData = {
        title: recipeData.title,
        description: recipeData.description,
        user_id: Cookies.get('user_id'),
        image: recipeData.image,
        Instructions:recipeData.Instructions,
        ingredients: recipeData.ingredients
      };
  
      const response = await fetch('/api/recipes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
  
      if (response.ok) {
        console.log('Recipe created successfully');
        toast.success('Recipe created successfully');
        navigate('/');
        // Optionally reset form state here
      } else {
        console.error('Error creating recipe client');
        console.log(requestData);
        toast.error('Error creating recipe client');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.response.data);
    }
  };
  

  const handleAddImageClick = async () => {
    try {
      if (!recipeData.image) {
        toast.error('Iamge Not Uploaded');
        return;
      }
  
      // AWS S3 config
      AWS.config.update({
        accessKeyId: '',
        secretAccessKey: '',
        region :'us-east-2'
      });
  
      const s3 = new AWS.S3();
      const file = recipeData.image;
  
      const params = {
        Bucket: 'recipemanagementimages',
        Key: `images/${file.name}`,
        Body: file,
        ACL: 'public-read',
      };
  
      // s3 file upload
      const data = await s3.upload(params).promise();
  
      console.log('File uploaded successfully:', data.Location);
      toast.success('File uploaded successfully');
  
      setRecipeData(prevState => ({
        ...prevState,
        image: data.Location
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };


  return (
    <div className="home-container">
      <div className="home-background"></div>
    <div className="container mx-auto px-4 py-8">
    <div className="centered-container">
    <div className="recipes-box">
      <h2 className="text-3xl font-semibold mb-4">Add Recipe</h2></div></div>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">Title:</label>
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Description:</label>
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="Instructions">Instruction:</label>
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ingredients">Ingredients:</label>
          {recipeData.ingredients.map((ingredient, index) => (
  <div key={index} className="mb-2">
    <input
      className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      type="text"
      placeholder={`Ingredient ${index + 1}`}
      value={ingredient.item}
      onChange={(e) => handleIngredientChange(index, 'item', e.target.value)}
      required
    />
    <input
      className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      type="text"
      placeholder={`Quantity ${index + 1}`}
      value={ingredient.quantity}
      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
      required
    />
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">Image:</label>
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
