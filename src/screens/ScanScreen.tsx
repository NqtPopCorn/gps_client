import { Camera, QrCode } from "lucide-react";

export function ScanScreen() {
  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Mock Camera View */}
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative">
          <Camera size={48} className="text-gray-600 mb-4 opacity-50" />
          <p className="text-gray-500 text-sm">Camera preview active</p>

          {/* QR Scanner Frame */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/20 rounded-3xl">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl -mb-1 -mr-1"></div>

            {/* Scanning line animation */}
            <div className="w-full h-0.5 bg-indigo-500 absolute top-0 left-0 shadow-[0_0_10px_#6366f1] animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>

      <div className="absolute top-safe pt-6 px-6 w-full z-10">
        <h1 className="text-2xl font-bold text-white text-center drop-shadow-md">
          Scan QR Code
        </h1>
        <p className="text-white/80 text-center text-sm mt-2 drop-shadow-md">
          Scan a location's QR code to start the audio guide
        </p>
      </div>

      <div className="absolute bottom-24 left-0 right-0 flex justify-center z-10">
        <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full flex items-center gap-2 font-medium">
          <QrCode size={20} />
          Upload from Gallery
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
