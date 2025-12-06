import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditVehiclePart() {
  const { vehicleId, partId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [part, setPart] = useState<any>(null);

  // Load part information
  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/vehicle-parts/${partId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPart(res.data);
      setLoading(false);
    }

    load().catch(console.error);
  }, [partId]);

  // Handle form changes
  function update(field: string, value: any) {
    setPart((prev: any) => ({ ...prev, [field]: value }));
  }

  async function save() {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `/api/vehicle-parts/${partId}`,
        {
          installation_date: part.installation_date?.split("T")[0],
          installation_mileage: Number(part.installation_mileage),
          warranty_mileage: part.warranty_mileage,
          estimated_life_mileage: part.estimated_life_mileage,
          cost: Number(part.cost),
          shop_location: part.shop_location,
          notes: part.notes,
          type: part.type,
          severity: part.severity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/vehicles/${vehicleId}?tab=history`);
    } catch (err) {
      console.error(err);
      alert("Failed to save part.");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!part) return <div className="p-6">Part not found.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Part</h1>

      <div className="space-y-4 bg-white p-4 rounded-xl shadow">
        
        {/* Installation Date */}
        <div>
          <label className="block font-medium text-sm">Installation Date</label>
          <input
            type="date"
            value={part.installation_date?.split("T")[0]}
            onChange={(e) => update("installation_date", e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Installation Mileage */}
        <div>
          <label className="block font-medium text-sm">Installation Mileage</label>
          <input
            type="number"
            value={part.installation_mileage}
            onChange={(e) => update("installation_mileage", e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Warranty Mileage */}
        <div>
          <label className="block font-medium text-sm">Warranty Mileage</label>
          <input
            type="number"
            value={part.warranty_mileage || ""}
            onChange={(e) => update("warranty_mileage", e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Estimated Life Mileage */}
        <div>
          <label className="block font-medium text-sm">Est. Life Mileage</label>
          <input
            type="number"
            value={part.estimated_life_mileage || ""}
            onChange={(e) => update("estimated_life_mileage", e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Cost */}
        <div>
          <label className="block font-medium text-sm">Cost</label>
          <input
            type="number"
            value={part.cost || ""}
            onChange={(e) => update("cost", e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Shop */}
        <div>
          <label className="block font-medium text-sm">Shop Location</label>
          <input
            value={part.shop_location || ""}
            onChange={(e) => update("shop_location", e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium text-sm">Notes</label>
          <textarea
            value={part.notes || ""}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full p-2 border rounded mt-1"
            rows={3}
          />
        </div>

        {/* Type Toggle */}
        <div className="mt-3">
          <label className="block text-sm font-medium">Type</label>
          <div className="flex mt-1">
            <button
              className={`flex-1 p-2 rounded-l border ${
                part.type === "new" ? "bg-blue-600 text-white" : ""
              }`}
              onClick={() => update("type", "new")}
            >
              New
            </button>
            <button
              className={`flex-1 p-2 rounded-r border ${
                part.type === "service" ? "bg-blue-600 text-white" : ""
              }`}
              onClick={() => update("type", "service")}
            >
              Service
            </button>
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium">Severity</label>
          <select
            value={part.severity}
            onChange={(e) => update("severity", e.target.value)}
            className="w-full p-2 border rounded mt-1"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Cancel
        </button>

        <button
          onClick={save}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
