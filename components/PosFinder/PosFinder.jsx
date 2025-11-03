const PositionFinder = ({ stage, onPositionsUpdate, initialPositions = [] }) => {
  const [positions, setPositions] = useState(initialPositions);
  const [decorationType, setDecorationType] = useState('flower');
  const containerRef = useRef(null);

  const stageImages = {
    seed: '🌰',
    sprout: '🌱',
    sapling: '🌿',
    young: '🌳',
    mature: '🌲',
    blooming: '🌸'
  };

  const handleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPos = { 
      x: parseFloat(x.toFixed(1)), 
      y: parseFloat(y.toFixed(1)),
      id: Date.now()
    };
    
    const updated = [...positions, newPos];
    setPositions(updated);
    if (onPositionsUpdate) onPositionsUpdate(updated);
  };

  const removePosition = (id) => {
    const updated = positions.filter(p => p.id !== id);
    setPositions(updated);
    if (onPositionsUpdate) onPositionsUpdate(updated);
  };

  const copyCode = () => {
    const code = `[\n${positions.map(p => `  { x: ${p.x}, y: ${p.y} },`).join('\n')}\n]`;
    navigator.clipboard.writeText(code);
    alert('Positions copied!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-xl">
          <h2 className="text-xl font-bold">Position Finder - {stage} stage</h2>
          <p className="text-sm text-white/80">Click on the tree to place message positions</p>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Canvas */}
          <div>
            <h3 className="font-semibold mb-3">Click to Place Positions</h3>
            <div
              ref={containerRef}
              onClick={handleClick}
              className="relative aspect-square bg-gradient-to-b from-sky-200 to-green-100 border-4 border-green-600 rounded-lg cursor-crosshair overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`${
                  stage === 'seed' ? 'text-7xl' :
                  stage === 'sprout' ? 'text-8xl' :
                  stage === 'sapling' ? 'text-9xl' :
                  stage === 'young' ? 'text-[10rem]' :
                  stage === 'mature' ? 'text-[12rem]' :
                  'text-[14rem]'
                }`}>
                  {stageImages[stage]}
                </div>
              </div>
              
              {positions.map((pos) => (
                <div
                  key={pos.id}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="absolute cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePosition(pos.id);
                  }}
                >
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs bg-black/75 text-white px-2 py-1 rounded whitespace-nowrap">
                    {pos.x}, {pos.y}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {positions.length} positions • Click dot to remove
            </p>
          </div>

          {/* Code Output */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Generated Positions</h3>
              <button
                onClick={copyCode}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Copy Code
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 font-mono">
{positions.length > 0 
  ? `[\n${positions.map(p => `  { x: ${p.x}, y: ${p.y} },`).join('\n')}\n]`
  : '// Click on tree to add positions'}
            </pre>

            {positions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Position List</h4>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {positions.map((pos, idx) => (
                    <div key={pos.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                      <span>#{idx + 1}: x: {pos.x}%, y: {pos.y}%</span>
                      <button
                        onClick={() => removePosition(pos.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionFinder;