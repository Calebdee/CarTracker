import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Part {
  part_id: number;
  category: string;
  name: string;
  expected_lifespan_miles?: number;
  expected_lifespan_months?: number;
}

interface PartEntry {
  part_id: string;
  cost: string;
  notes: string;
  warranty_mileage: string;
  warranty_months: string;
  estimated_life_mileage: string;
  estimated_life_months: string;
  type: string;
}

export default function AddPart() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [partsCatalog, setPartsCatalog] = useState<Part[]>([]);
  const [entries, setEntries] = useState<PartEntry[]>([
    {
      part_id: "",
      cost: "",
      notes: "",
      warranty_mileage: "",
      warranty_months: "",
      estimated_life_mileage: "",
      estimated_life_months: "",
      type: "new",
    },
  ]);

  // Top-level service info
  const [serviceDate, setServiceDate] = useState("");
  const [mileage, setMileage] = useState("");
  const [shop, setShop] = useState("");

  // Load parts list
  useEffect(() => {
    async function loadParts() {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/parts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPartsCatalog(res.data);
    }

    loadParts().catch(console.error);
  }, []);

  // Handle part entry updates
  function updateEntry(index: number, field: string, value: string) {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  }

  // Add another part entry
  function addEntry() {
    setEntries([
      ...entries,
      {
        part_id: "",
        cost: "",
        notes: "",
        warranty_mileage: "",
        warranty_months: "",
        estimated_life_mileage: "",
        estimated_life_months: "",
        type: "new",
      },
    ]);
  }

  // Submit service record
  async function handleSubmit(e: any) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `/api/vehicles/${vehicleId}/add-parts`,
        {
          service_date: serviceDate,
          mileage,
          shop,
          parts: entries,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await axios.post(
        `/api/vehicles/${vehicleId}/odometer`,
        {
          date: serviceDate,
          mileage: Number(mileage),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate(`/vehicles/${vehicleId}?tab=history`);
    } catch (err) {
      console.error("Error saving service:", err);
      alert("Failed to save service record.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* ======= HEADER ======= */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-lg text-gray-700 hover:text-gray-900"
        >
          ← Back
        </button>

        <h1 className="text-xl font-bold">Add Service / Parts</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ======= SERVICE INFO ======= */}
        <div className="bg-white shadow p-4 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold mb-2">Service Information</h2>

          <div>
            <label className="block font-medium text-sm">Service Date</label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-sm">Mileage</label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-sm">Shop Location</label>
            <input
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="Joe's Auto Shop"
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        </div>

        {/* ======= PARTS SECTION ======= */}
        <div className="bg-white shadow p-4 rounded-xl space-y-6">
          <h2 className="text-lg font-semibold mb-2">Parts Replaced / Installed</h2>

          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 bg-gray-50 space-y-3"
            >
              <div>
                <label className="block text-sm font-medium">Part</label>
                <select
                  value={entry.part_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const part = partsCatalog.find(
                      (p) => String(p.part_id) === String(selectedId)
                    );

                    setEntries((prev) => {
                      const updated = [...prev];

                      updated[idx] = {
                        ...updated[idx],
                        part_id: selectedId,
                        estimated_life_mileage:
                          part?.expected_lifespan_miles?.toString() || "",
                        estimated_life_months:
                          part?.expected_lifespan_months?.toString() || "",
                      };

                      return updated;
                    });
                  }}

                  className="w-full p-2 border rounded mt-1"
                  required
                >
                  <option value="">Select part…</option>
                  {partsCatalog.map((p) => (
                    <option key={p.part_id} value={p.part_id}>
                      {p.category} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Cost ($)</label>
                <input
                  type="number"
                  value={entry.cost}
                  onChange={(e) =>
                    updateEntry(idx, "cost", e.target.value)
                  }
                  className="w-full p-2 border rounded mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea
                  value={entry.notes}
                  onChange={(e) =>
                    updateEntry(idx, "notes", e.target.value)
                  }
                  className="w-full p-2 border rounded mt-1"
                  rows={2}
                />
              </div>

              {/* Warranty & Estimated Life */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Warranty Miles</label>
                  <input
                    type="number"
                    value={entry.warranty_mileage}
                    onChange={(e) =>
                      updateEntry(idx, "warranty_mileage", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Warranty Months</label>
                  <input
                    type="number"
                    value={entry.warranty_months}
                    onChange={(e) =>
                      updateEntry(idx, "warranty_months", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Est. Life (Miles)</label>
                  <input
                    type="number"
                    value={entry.estimated_life_mileage}
                    onChange={(e) =>
                      updateEntry(idx, "estimated_life_mileage", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Est. Life (Months)</label>
                  <input
                    type="number"
                    value={entry.estimated_life_months}
                    onChange={(e) =>
                      updateEntry(idx, "estimated_life_months", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>

                {/* ==== TYPE TOGGLE ==== */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>

                  <div className="flex w-full rounded-lg overflow-hidden border border-gray-300">
                    <button
                      onClick={() => updateEntry(idx, "type", "new")}
                      className={`flex-1 py-2 text-center transition ${
                        entry.type === "new"
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      New Part
                    </button>

                    <button
                      onClick={() => updateEntry(idx, "type", "service")}
                      className={`flex-1 py-2 text-center transition ${
                        entry.type === "service"
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      Service
                    </button>
                  </div>
                </div>


              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition"
          >
            + Add Another Part
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl text-lg font-semibold"
        >
          Save Service Record
        </button>
      </form>
    </div>
  );
}
