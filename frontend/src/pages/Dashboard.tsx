import { useEffect, useState } from "react";
import { FaCog, FaPlus } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  color?: string;
  picture_url?: string;
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const navigate = useNavigate();



  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    vin: "",
    plate: "",
    picture_url: "",
    trim: "",
    purchase_date: "",
    purchase_mileage: "",
    purchase_type: "",
    nickname: "",
    color: "",
  });

  // ----- Fetch vehicles -----
  async function fetchVehicles() {
    try {
      const res = await axios.get("/api/vehicles", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setVehicles(res.data);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
    }
  }

  useEffect(() => {
    fetchVehicles();
  }, []);

  // ----- Handle form input -----
  function handleInput(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "multipart/form-data",
        },
      });

      setForm({ ...form, picture_url: res.data.url });
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image.");
    }
  }

  // ----- Submit new vehicle -----
  async function handleSubmit(e: any) {
    e.preventDefault();

    try {
      await axios.post("/api/vehicles", form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });

      setShowForm(false);
      setForm({
        make: "",
        model: "",
        year: "",
        vin: "",
        plate: "",
        picture_url: "",
        trim: "",
        purchase_date: "",
        purchase_mileage: "",
        purchase_type: "",
        nickname: "",
        color: "",
      });

      fetchVehicles();
    } catch (err) {
      console.error("Error saving vehicle:", err);
      alert("Failed to add vehicle.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ======= TOP NAV ======= */}
      <div className="w-full bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Car Tracker</h1>
        <button className="text-gray-600 hover:text-gray-800 transition">
          <FaCog size={24} />
        </button>
      </div>

      {/* ======= VEHICLE CARDS ======= */}
      <div className="p-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vehicles.map((v) => (
          <div
            key={v.id}
            onClick={() => navigate(`/vehicle/${v.id}`)}
            className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer"
          >

            <div className="h-40 bg-gray-200">
              {v.picture_url ? (
                <img
                  src={v.picture_url}
                  alt={`${v.make} ${v.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            <div className="p-4">
              <h2 className="text-lg font-semibold">
                {v.year} {v.color} {v.make} {v.model}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* ======= ADD VEHICLE BUTTON ======= */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition"
      >
        <FaPlus size={22} />
      </button>

      {/* ======= ADD VEHICLE MODAL ======= */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Vehicle</h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium">Make</label>
                <input
                  name="make"
                  value={form.make}
                  onChange={handleInput}
                  className="w-full border rounded p-2 mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Model</label>
                <input
                  name="model"
                  value={form.model}
                  onChange={handleInput}
                  className="w-full border rounded p-2 mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Year</label>
                <input
                  name="year"
                  type="number"
                  value={form.year}
                  onChange={handleInput}
                  className="w-full border rounded p-2 mt-1"
                  required
                />
              </div>

               <div>
                <label className="block text-sm font-medium">Nickname</label>
                <input
                  name="nickname"
                  value={form.nickname}
                  onChange={handleInput}
                  className="w-full border rounded p-2 mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">License Plate</label>
                <input
                  name="plate"
                  value={form.plate}
                  onChange={handleInput}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>

              {/* ---- PICTURE URL + UPLOAD BUTTON ---- */}
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Image</label>

                {/* Preview */}
                {form.picture_url && (
                  <img
                    src={form.picture_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded mb-2 border"
                  />
                )}

                <div className="flex gap-2">
                  <input
                    name="picture_url"
                    value={form.picture_url}
                    onChange={handleInput}
                    placeholder="https://example.com/car.jpg"
                    className="flex-1 border rounded p-2"
                  />

                  <input
                    type="file"
                    id="upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />

                  <button
                    type="button"
                    onClick={() => document.getElementById("upload")?.click()}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  >
                    Upload
                  </button>
                </div>
              </div>

              {/* ===== Additional Information Toggle ===== */}
              <div
                className="mt-4 cursor-pointer text-blue-600 font-medium"
                onClick={() => setShowExtra((prev) => !prev)}
              >
                Additional Information {showExtra ? "▲" : "▼"}
              </div>

              {showExtra && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Trim */}
                  <div>
                    <label className="block text-sm font-medium">Color</label>
                    <input
                      name="trim"
                      value={form.color}
                      onChange={handleInput}
                      className="w-full border rounded p-2 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">VIN</label>
                    <input
                      name="vin"
                      value={form.vin}
                      onChange={handleInput}
                      className="w-full border rounded p-2 mt-1"
                    />
                  </div>

                  {/* Trim */}
                  <div>
                    <label className="block text-sm font-medium">Trim</label>
                    <input
                      name="trim"
                      value={form.trim}
                      onChange={handleInput}
                      className="w-full border rounded p-2 mt-1"
                    />
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="block text-sm font-medium">Purchase Date</label>
                    <input
                      type="date"
                      name="purchase_date"
                      value={form.purchase_date}
                      onChange={handleInput}
                      className="w-full border rounded p-2 mt-1"
                    />
                  </div>

                  {/* Purchase Mileage */}
                  <div>
                    <label className="block text-sm font-medium">Purchase Mileage</label>
                    <input
                      type="number"
                      name="purchase_mileage"
                      value={form.purchase_mileage}
                      onChange={handleInput}
                      className="w-full border rounded p-2 mt-1"
                    />
                  </div>

                  {/* Purchase Type */}
                  <div>
                    <label className="block text-sm font-medium">Purchase Type</label>
                    <select
                      name="purchase_type"
                      value={form.purchase_type}
                      onChange={handleInput}
                      className="w-full border rounded p-2 mt-1"
                    >
                      <option value="">Select...</option>
                      <option value="new">New</option>
                      <option value="used_clean">Used (Clean)</option>
                      <option value="used_salvage">Used (Salvage)</option>
                    </select>
                  </div>

                </div>
              )}




              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
