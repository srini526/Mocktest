import React from 'react';

const Card = ({ title, description, buttonText, onClick }) => {
  return (
    <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
      <div className=" bg-[#2A0E3C]/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/80 mb-4">{description}</p>
        <button
          onClick={onClick}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-pink-500 transition-all"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default Card;
