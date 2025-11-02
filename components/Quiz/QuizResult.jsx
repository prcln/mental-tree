const QuizResult = ({ result, onContinue }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-100 via-pink-50 to-green-100 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-slideUp">
        <div className="mb-6">
          <div className="text-8xl mb-4 animate-bounce">{result.treeInfo.icon}</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">You're a {result.treeInfo.name}!</h2>
          <p className="text-green-600 font-semibold mb-4">{result.treeInfo.trait}</p>
        </div>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          {result.treeInfo.description}
        </p>

        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Start Growing Your Tree! 🌱
        </button>
      </div>
    </div>
  );
};

export default QuizResult