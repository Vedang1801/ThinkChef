import { useState } from "react";
import "../styles/tips.css";
import { BookOpen, Coffee, ChefHat } from "lucide-react";

const Tips = () => {
  // Only import the first 6 tips for display in the grid
  const tipsList = [
    {
      icon: <ChefHat size={22} />,
      tip: "Preheat your oven before baking for consistent results.",
      category: "Basics"
    },
    {
      icon: <Coffee size={22} />,
      tip: "Use fresh herbs for better flavor in your dishes.",
      category: "Flavor"
    },
    {
      icon: <BookOpen size={22} />,
      tip: "Read recipes thoroughly before starting to ensure you have all the ingredients.",
      category: "Preparation"
    },
    {
      icon: <ChefHat size={22} />,
      tip: "Don't overcrowd the pan when sautéing vegetables.",
      category: "Technique"
    },
    {
      icon: <Coffee size={22} />,
      tip: "Season your food throughout the cooking process.",
      category: "Flavor"
    },
    {
      icon: <BookOpen size={22} />,
      tip: "Let meat rest before slicing to allow juices to redistribute.",
      category: "Advanced"
    },
  ];

  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="tips-container">
      {tipsList.map((tipItem, index) => (
        <div 
          className="tip-card" 
          key={index}
          onMouseEnter={() => setHoveredCard(index)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="tip-icon">{tipItem.icon}</div>
          <div className="tip-category">{tipItem.category}</div>
          <h3>Cooking Tip</h3>
          <p>{tipItem.tip}</p>
        </div>
      ))}
    </div>
  );
};

export default Tips;
