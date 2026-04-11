// import { useState } from "react";
// import { Lock } from "lucide-react";

// interface ActivationGuardScreenProps {
//   onActivate: () => void;
// }

// export function ActivationGuardScreen({
//   onActivate,
// }: ActivationGuardScreenProps) {
//   const [code, setCode] = useState("");
//   const [error, setError] = useState("");
//   const ACTIVATION_CODE = "free";

//   const handleSubmit = () => {
//     if (code.toLowerCase() === ACTIVATION_CODE) {
//       setError("");
//       onActivate();
//     } else {
//       setError("Invalid activation code");
//       setCode("");
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       handleSubmit();
//     }
//   };

//   return (
//     <div className="flex flex-col h-full bg-gradient-to-br from-indigo-600 to-indigo-800 items-center justify-center px-6">
//       <div className="flex flex-col items-center gap-6 w-full">
//         {/* Lock Icon */}
//         <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
//           <Lock size={32} className="text-white" />
//         </div>

//         {/* Title */}
//         <div className="text-center">
//           <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
//           <p className="text-indigo-100 text-sm">
//             Enter your activation code to continue
//           </p>
//         </div>

//         {/* Input Section */}
//         <div className="w-full max-w-xs space-y-4">
//           <input
//             type="password"
//             value={code}
//             onChange={(e) => setCode(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Enter activation code"
//             className="w-full px-4 py-3 rounded-xl bg-white/90 text-center text-lg tracking-wider font-semibold placeholder-gray-400 outline-none focus:ring-2 focus:ring-white focus:bg-white transition-all"
//           />

//           {error && (
//             <p className="text-red-200 text-sm font-medium text-center">
//               {error}
//             </p>
//           )}

//           <button
//             onClick={handleSubmit}
//             disabled={!code}
//             className="w-full bg-white text-indigo-600 font-semibold py-3 rounded-xl hover:bg-indigo-50 disabled:bg-white/50 disabled:text-indigo-400 transition-all shadow-lg"
//           >
//             Activate
//           </button>
//         </div>

//         {/* Demo Hint */}
//         <p className="text-indigo-100 text-xs text-center mt-4">
//           Demo code: <span className="font-mono text-white">free</span>
//         </p>
//       </div>
//     </div>
//   );
// }
