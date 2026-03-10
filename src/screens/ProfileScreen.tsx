import {
  User,
  Settings,
  CreditCard,
  Download,
  Moon,
  LogOut,
  ChevronRight,
} from "lucide-react";

export function ProfileScreen() {
  const menuItems = [
    { icon: Download, label: "Offline Audio", value: "1.2 GB" },
    { icon: CreditCard, label: "Payment Methods", value: "" },
    { icon: Moon, label: "Dark Mode", value: "Off" },
    { icon: Settings, label: "Settings", value: "" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-6 pt-12 pb-6 bg-white shadow-sm z-10">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Guest User</h2>
            <p className="text-sm text-gray-500">guest@example.com</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                  <item.icon size={20} />
                </div>
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.value && (
                  <span className="text-sm text-gray-500">{item.value}</span>
                )}
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        <button className="w-full bg-white text-red-600 font-semibold py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </div>
  );
}
