import { useState } from "react";
import AuthForm from "../../components/AuthComponent/AuthComponent";
import PersonalityQuiz from "../../components/Quiz/Quiz";
import QuizResult from "../../components/Quiz/QuizResult";
import { useAuth } from "../../contexts/AuthContext/AuthContext";

const MoodTreeApp = () => {
  const user = useAuth();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [treeData, setTreeData] = useState({
    stage: 'seed',
    moodScore: 0,
    messages: []
  });
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowQuiz(true);
  };

  const handleQuizComplete = (result) => {
    setQuizResult(result);
  };

  // TODO: Add the start tree
  const handleStartTree = () => {
    setQuizResult(null);
  };

  const handleCheckIn = (data) => {
    setTreeData(prev => ({
      ...prev,
      moodScore: prev.moodScore + data.points,
      stage: getStage(prev.moodScore + data.points)
    }));
    setShowCheckIn(false);
  };

  const handleMessage = (data) => {
    setTreeData(prev => ({
      ...prev,
      messages: [...prev.messages, { ...data, id: Date.now() }],
      moodScore: prev.moodScore + 5
    }));
    setShowEncouragement(false);
  };

  const getStage = (score) => {
    if (score < 10) return 'seed';
    if (score < 30) return 'sprout';
    if (score < 60) return 'sapling';
    if (score < 100) return 'young';
    if (score < 150) return 'mature';
    return 'blooming';
  };

  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  if (showQuiz && !quizResult) {
    return <PersonalityQuiz onComplete={handleQuizComplete} />;
  }

  if (quizResult) {
    return <QuizResult result={quizResult} onContinue={handleStartTree} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-pink-50 to-green-100">
      <button
        onClick={() => setUser(null)}
        className="fixed top-4 right-4 bg-white/90 backdrop-blur px-6 py-2 rounded-full font-semibold text-gray-700 hover:bg-white hover:shadow-lg transition-all z-10"
      >
        Sign Out
      </button>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">✨ Your Mood Tree ✨</h1>
            <div className="flex gap-6 justify-center text-gray-700">
              <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full">
                <Droplets size={20} className="text-blue-500" />
                <span className="font-semibold">{treeData.moodScore} points</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full">
                <MessageCircle size={20} className="text-pink-500" />
                <span className="font-semibold">{treeData.messages.length} messages</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-100 px-6 py-2 rounded-full">
              <Star size={20} className="text-amber-600" />
              <span className="font-bold text-amber-800">
                {treeData.stage === 'seed' && 'Seed of Hope'}
                {treeData.stage === 'sprout' && 'New Beginning'}
                {treeData.stage === 'sapling' && 'Growing Strong'}
                {treeData.stage === 'young' && 'Reaching Higher'}
                {treeData.stage === 'mature' && 'Flourishing'}
                {treeData.stage === 'blooming' && 'Full Bloom'}
              </span>
            </div>
          </div>

          <TreeVisualization 
            stage={treeData.stage}
            moodScore={treeData.moodScore}
            messages={treeData.messages}
          />

          <div className="flex gap-4 justify-center mt-8 flex-wrap">
            <button
              onClick={() => setShowCheckIn(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Droplets size={20} />
              Daily Check-in
            </button>
            <button
              onClick={() => setShowEncouragement(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <MessageCircle size={20} />
              Send Encouragement
            </button>
          </div>
        </div>
      </div>

      {showCheckIn && (
        <DailyCheckIn onSubmit={handleCheckIn} onClose={() => setShowCheckIn(false)} />
      )}
      {showEncouragement && (
        <SendEncouragement onSubmit={handleMessage} onClose={() => setShowEncouragement(false)} />
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes grow {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .animate-grow {
          animation: grow 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MoodTreeApp;