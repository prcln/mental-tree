const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-pink-50 to-green-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🌳 Your Mood Tree</h1>
              <p className="text-gray-600">Welcome, {user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-gray-600 text-lg">Your mood tree is growing!</p>
            <p className="text-gray-500 mt-2">Start tracking your emotions to watch it flourish.</p>
          </div>
        </div>
      </div>
    </div>
  );
};