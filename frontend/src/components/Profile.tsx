import { useEffect , useState} from 'react';
import axios from 'axios'; // Import Axios for making HTTP requests
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';

interface Post {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  user_id: number;
  image: string;
  created_at: Date;
}

const Profile = () => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(()=>{
    if (!loggedIn) {
      navigate('/login'); // Redirect to login if user is not logged in
    } 
  })

  useEffect(() => {
      fetchPosts();
  }, [loggedIn, navigate]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`/api/recipes/${Cookies.get("user_id")}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      const response = await axios.delete(`/api/recipes/delete/${postId}`);
      if (response.status === 200) {
        // Remove the deleted post from the state
        setPosts(posts.filter(post => post.recipe_id !== postId));
        toast.success("Post Deleted")
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      // Handle error
      toast.error("Error deleting post")
    }
  };

  return (
    <div className="home-container">
      <div className="profile-background"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="centered-container">
          <div className="profile-box">
            <h2 className="text-3xl font-semibold mb-4">Profile</h2>
          </div>
        </div>
        <div className="profile-container">
          <div className="mb-4">
            <label className="profile-label">Username:</label>
            <span className="profile-text">{Cookies.get('username')}</span>
          </div>
          <div className="mb-4">
            <label className="profile-label">Email:</label>
            <span className="profile-text">{Cookies.get('email')}</span>
          </div>
        </div>
        <div className="post-grid">
          {posts.map((post) => (
            <div key={post.recipe_id} className="post-card">
              <div className="post-image-container">
                <img src={post.image} alt={post.title} className="post-image" />
              </div>
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-description">{post.description}</p>
                <button onClick={() => handleDelete(post.recipe_id)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Profile;
