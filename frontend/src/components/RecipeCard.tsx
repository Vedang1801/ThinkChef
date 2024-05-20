import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuth } from './authContext';
import { Link } from 'react-router-dom';



interface RecipeCardProps {
  recipe: {
    recipe_id: number;
    title: string;
    Instruction:string;
    description: string;
    ingredients: string[];
    image: string;
    created_at: string;
  };
}



interface Comment {
  comment_id: number;
  comment_text: string;
  username:string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const { user,loggedIn } = useAuth();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/recipes/${recipe.recipe_id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async () => {
    try {
      await axios.post(`/api/recipes/${recipe.recipe_id}/comments/create`, {
        comment_text: commentText,
        user_id: Cookies.get('user_id'),
        username: Cookies.get('username')
        , // Replace with the actual user ID
      });
      setCommentText('');
      fetchComments(); // Fetch updated comments after submitting
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="recipeCard">
      <div className="recipeImage">
        <img src={recipe.image} alt={recipe.title} />
      </div>
      <div className="recipeContent">
        <div className="titles">
          <div>
          <div className="font-bold text-3xl py-1">{recipe.title}</div>
          <div className="text-gray-700 text-base text-md  ">{recipe.description}</div>
          <div className="font-bold text-md mt-2 "><b>Instructions: </b><br></br>
          <p className="text-slate-900 text-base text-md" >{recipe.Instruction}</p>          
          </div>
          </div>
          <div className="text-slate-900 text-xl ml-3 px-4">
            <b>Ingredients:</b> {recipe.ingredients.map((ele,idx)=>(<div className='text-lg p-1' key={idx}>{ele}<br></br></div>))}
          </div>
        </div>
        <div>
        {loggedIn? 
        <>
                <div className="comments">
                <h4 className="font-bold text-lg mb-2">Comments</h4>
                <ul>
                  {comments.map(comment => (
                    <li key={comment.comment_id}><b>{comment.username} </b>: {comment.comment_text}</li>
                  ))}
                </ul>
              </div>
              <div className="commentInput">
                <input
                  className='input-comment'
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button className='btn-comment' onClick={handleCommentSubmit}>ADD</button>
              </div>
        </>
        :
        <>
        <Link to="/login"><h1><i>Please Login to Add Comments</i></h1></Link></>
        }

        <p className="text-right text-gray-700">
            {recipe.created_at.slice(0,10)}
          </p>
          </div>

        </div>

    </div>
  );
};

export default RecipeCard;
