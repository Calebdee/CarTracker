import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { FaChevronRight } from "react-icons/fa";

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  plate: string;
  trim: string;
  nickname: string;
  purchase_type: string;
  color: string;
  purchase_date: string;
  picture_url?: string;
}

interface VehiclePartHistory {
  id: number;
  name: string;
  installation_date: string;
  installation_mileage: number;
  warranty_mileage?: number;
  estimated_life_mileage?: number;
  warranty_date?: string;
  estimated_life_months?: string;
  cost: number;
  type: string;
  shop_location?: string;
  notes?: string;
}

interface UpcomingFix {
  part_id: number;
  name: string;
  due_miles?: number;
  due_date?: string;
  reason: string;
  severity: string;
  fixed_severity: string;
}

export default function CarView() {
  const params = useParams<{ id: string }>();
  const vehicleId = params.id;

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "upcoming"
  >("overview");

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<VehiclePartHistory[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingFix[]>([]);
  const [selectedPart, setSelectedPart] = useState<VehiclePartHistory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<{ id: number; url: string }[]>([]);
  const [fullImage, setFullImage] = useState<string | null>(null);



  // ===== Fetch Data =====
  useEffect(() => {
    if (!vehicleId) return;

    async function load() {
      const token = localStorage.getItem("token");

      const [vRes, hRes, uRes] = await Promise.all([
        axios.get(`/api/vehicles/${vehicleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/vehicles/${vehicleId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/vehicles/${vehicleId}/upcoming`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      


      setVehicle(vRes.data);
      setHistory(hRes.data);
      setUpcoming(uRes.data);
    }

    load().catch(console.error);
  }, [vehicleId]);

  // ===== Select Part Handler =====
  // function handleSelectPart(part: string) {
  //   alert("Selected part: " + part);
  //   // You can replace with a modal later
  // }

  if (!vehicle)
    return <div className="p-6 text-center text-lg">Loading...</div>;

  const formattedPurchaseDate = new Date(vehicle.purchase_date).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  function openPart(part: any) {
    setSelectedPart(part);
    loadAttachments(part.id);
  }

  async function loadAttachments(partId: number) {
    const token = localStorage.getItem("token");
    const res = await axios.get(`/api/vehicle-parts/${partId}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAttachments(res.data);
  }


  async function handleAddAttachment(e: any, partId: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      await axios.post(`/api/vehicle-parts/${partId}/attachments`, formData, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "multipart/form-data",
        },
      });

      // Automatically refresh attachments
      await loadAttachments(partId);
    } catch (err) {
      console.error(err);
      alert("Failed to upload attachment.");
    } finally {
      setIsUploading(false);
    }
  }

  const severityStyles: Record<string, any> = {
    green: {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-800",
      badge: "bg-green-600 text-white"
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-800",
      badge: "bg-yellow-500 text-white"
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      text: "text-orange-800",
      badge: "bg-orange-600 text-white"
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-800",
      badge: "bg-red-600 text-white"
    },
  };



  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ========================================================= */}
      {/* ====================== TOP BAR ========================== */}
      {/* ========================================================= */}
      <div className="bg-white shadow px-4 py-4 relative flex items-center">
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-900 text-lg absolute left-4"
        >
          ← Back
        </button>

        {/* CENTERED TITLE */}
        <h1 className="text-2xl font-bold mx-auto text-center">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
      </div>


      {/* ========================================================= */}
      {/* ======================== TABS =========================== */}
      {/* ========================================================= */}
      <div className="bg-white shadow-sm flex border-b">
        {[
          { id: "overview", label: "Overview" },
          { id: "history", label: "History" },
          { id: "upcoming", label: "Upcoming" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex-1 text-center py-3 font-medium 
              ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      

      {/* ========================================================= */}
      {/* =================== TAB CONTENT WRAPPER ================= */}
      {/* ========================================================= */}
      <div className="p-4 flex-1 overflow-y-auto">

        {/* ========================================================= */}
        {/* ====================== OVERVIEW TAB ===================== */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div>
            {/* ===== VEHICLE SUMMARY CARD ===== */}
            <div className="bg-white shadow px-4 py-4 rounded-xl">
              <div className="flex flex-col md:flex-row gap-6">

                {/* LEFT: IMAGE */}
                {vehicle.picture_url && (
                  <div className="w-full md:w-1/3">
                    <img
                      src={vehicle.picture_url}
                      alt="Car"
                      className="w-full rounded-xl object-cover shadow-md"
                    />
                  </div>
                )}

                {/* RIGHT: DETAILS */}
                

                <div className="flex-1 flex flex-col text-gray-700 space-y-1">
                  {vehicle.nickname && (
                    <p className="text-lg font-semibold italic">
                      “{vehicle.nickname}”
                    </p>
                  )}

                  <p>
                    <span className="font-semibold">Trim:</span>{" "}
                    {vehicle.trim || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Color:</span>{" "}
                    {vehicle.color || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">VIN:</span>{" "}
                    {vehicle.vin || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Plate:</span>{" "}
                    {vehicle.plate || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Purchased:</span>{" "}
                    {formattedPurchaseDate || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Type:</span>{" "}
                    {vehicle.purchase_type || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* ===== DIAGRAM ===== */}
            {/* <h2 className="text-lg font-semibold mt-6 mb-2">
              Interactive Overview
            </h2>
            <InteractiveCarDiagram onSelect={handleSelectPart} /> */}
          </div>
        )}

        {/* ========================================================= */}
        {/* ====================== HISTORY TAB ====================== */}
        {/* ========================================================= */}
        {activeTab === "history" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Service History</h2>

            {history.length === 0 && (
              <p className="text-gray-500">No service history yet.</p>
            )}

            <div className="space-y-1">

              {history.map((item) => {
                // Convert ISO timestamp → "Month Day, Year"
                const formattedDate = new Date(item.installation_date).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                );

                return (
                  
                  <button
                    key={item.id}
                    onClick={() => openPart(item)}
                    //onClick={() => setSelectedPart(item)}
                    className="
                      w-full text-left bg-white p-4 rounded-xl shadow border 
                      flex items-center justify-between hover:shadow-md transition
                    "
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {item.type === "new" ? "New " : ""}
                        {item.name}
                      </h3>

                      <p className="text-sm text-gray-600">
                        Installed on {formattedDate}
                      </p>
                    </div>

                    <FaChevronRight className="text-gray-400" />
                  </button>
                );
              })}

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ==================== UPCOMING FIXES TAB ================ */}
        {/* ========================================================= */}
        {activeTab === "upcoming" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Upcoming Maintenance
            </h2>

            {upcoming.length === 0 && (
              <p className="text-gray-500">Nothing due soon!</p>
            )}

            <div className="space-y-1">
              {upcoming.map((fix) => {
              const style = severityStyles[fix.severity] || severityStyles.green;

              return (
                <div
                  key={fix.part_id}
                  className={`
                    relative p-4 rounded-xl shadow border
                    ${style.bg} ${style.border}
                  `}
                >
                  {/* TOP RIGHT BADGE */}
                  <span
                    className={`
                      absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded
                      ${style.badge}
                    `}
                  >
                    {fix.fixed_severity.toLowerCase()}
                  </span>

                  <h3 className={`font-semibold ${style.text}`}>
                    {fix.name}
                  </h3>

                  <p className="text-sm text-gray-700">{fix.reason}</p>

                  {/* Details */}
                  <div className="mt-2 text-sm text-gray-700">
                    {fix.due_miles && (
                      <p>
                        <b>Due Mileage:</b> {fix.due_miles.toLocaleString()}
                      </p>
                    )}
                    {fix.due_date && (
                      <p>
                        <b>Due Date:</b> {fix.due_date}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            </div>
          </div>
        )}

      </div>
      {selectedPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedPart(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4">{selectedPart.name}</h2>

            <div className="space-y-2 text-gray-700">
              {selectedPart.type === "new" && (
                <p className="font-semibold text-green-700">New Part</p>
              )}

              <p><b>Installed:</b> {new Date(selectedPart.installation_date).toLocaleDateString()}</p>

              {selectedPart.warranty_date != null && (
                <p><b>Under Warranty Until:</b> {selectedPart.warranty_date.toLocaleString()} miles</p>
              )}

              {selectedPart.estimated_life_months != null && (
                <p><b>Estimated Life Until:</b> {selectedPart.estimated_life_months.toLocaleString()} miles</p>
              )}

              {selectedPart.installation_mileage && (
                <p><b>Starting Mileage:</b> {selectedPart.installation_mileage.toLocaleString()} miles</p>
              )}

              {selectedPart.warranty_mileage != null && selectedPart.installation_mileage != null && (
                <p>
                  <b>Warranty Expires At:</b>{" "}
                  {(selectedPart.installation_mileage + selectedPart.warranty_mileage).toLocaleString()}{" "}
                  miles
                </p>
              )}

              {selectedPart.estimated_life_mileage != null && selectedPart.installation_mileage != null && (
                <p>
                  <b>Estimated Life Mileage:</b>{" "}
                  {(selectedPart.installation_mileage + selectedPart.estimated_life_mileage).toLocaleString()}{" "}
                  miles
                </p>
              )}


              {selectedPart.cost && (
                <p><b>Cost:</b> ${selectedPart.cost.toFixed(2)}</p>
              )}

              {selectedPart.shop_location && (
                <p><b>Shop:</b> {selectedPart.shop_location}</p>
              )}

              {selectedPart.notes && (
                <p><b>Notes:</b> {selectedPart.notes}</p>
              )}
            </div>

            {isUploading && (
            <div className="flex items-center gap-2 text-blue-600 mt-4">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              <span>Uploading...</span>
            </div>
          )}


            {/* ===== Attachments Section ===== */}
              {attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Attachments</h3>

                  <div className="grid grid-cols-3 gap-3">
                    {attachments.map((a) => (
                      <img
                        key={a.id}
                        src={a.url}
                        onClick={() => setFullImage(a.url)}
                        className="w-full h-24 object-cover rounded cursor-pointer border hover:opacity-80"
                      />
                    ))}
                  </div>
                </div>
              )}

            <div className="mt-6 flex justify-end gap-3">
              <input
                id="fileAttachment"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAddAttachment(e, selectedPart.id)}
              />

              

              {fullImage && (
                <div
                  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                  onClick={() => setFullImage(null)}
                >
                  <img src={fullImage} className="max-h-[90%] max-w-[90%] rounded shadow-lg" />
                </div>
              )}

              <button
                onClick={() => document.getElementById("fileAttachment")?.click()}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Attachment
              </button>


              <button
                onClick={() => console.log("Edit part:", selectedPart?.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>

              <button
                onClick={() => setSelectedPart(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ======= ADD PART BUTTON ======= */}
  <button
    onClick={() => navigate(`/vehicles/${vehicleId}/add-part`)}
    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition"
  >
    <FaPlus size={20} />
  </button>
    </div>
    
  );
  

}
