import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { FaChevronRight } from "react-icons/fa";
import { FaRegFileAlt } from "react-icons/fa";

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

interface VehicleRegistration {
  registration_id: number;
  vehicle_id: number;
  registration_date: string;
  expiration_date: string;
  plate_number?: string;
  state?: string;
  renewal_cost?: number;
  notes?: string;
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

interface RegistrationAttachment {
  id: number;
  url: string;
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
  const [latestOdometer, setLatestOdometer] = useState<{ mileage: number; date: string } | null>(null);
  const [showOdoModal, setShowOdoModal] = useState(false);
  const [odoDate, setOdoDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [odoMileage, setOdoMileage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [latestRegistration, setLatestRegistration] = useState<VehicleRegistration | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [newRegDate, setNewRegDate] = useState("");
  const [newRegNotes, setNewRegNotes] = useState("");
  const [loanInfo, setLoanInfo] = useState<any>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [newRegState, setNewRegState] = useState("UT");
  const [regAttachments, setRegAttachments] = useState<RegistrationAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sortOption, setSortOption] = useState<"importance" | "urgency">("urgency");

  const [loanForm, setLoanForm] = useState({
    lender: "",
    start_date: new Date().toISOString().split("T")[0],
    term_months: "",
    interest_rate: "",
    notes: ""
  });
  const [newRegStart, setNewRegStart] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ===== Fetch Data =====
  useEffect(() => {
    if (!vehicleId) return;

    async function load() {
      const token = localStorage.getItem("token");

      const [vRes, hRes, uRes, oRes, rRes, lRes] = await Promise.all([
        axios.get(`/api/vehicles/${vehicleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/vehicles/${vehicleId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/vehicles/${vehicleId}/upcoming`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/vehicles/${vehicleId}/odometer/latest`, { headers: { Authorization: `Bearer ${token}` }}),

        axios.get(`/api/vehicles/${vehicleId}/registration/latest`, { headers: { Authorization: `Bearer ${token}` }}),

        axios.get(`/api/vehicles/${vehicleId}/loan`, { headers: { Authorization: `Bearer ${token}` }}),

      ]);

      


      setVehicle(vRes.data);
      setHistory(hRes.data);
      setUpcoming(uRes.data);
      setLatestOdometer(oRes.data);
      setLatestRegistration(rRes.data);
      setLoanInfo(lRes.data);

    }

    load().catch(console.error);
  }, [vehicleId]);

  function formatPurchaseType(type: string) {
    if (type === "new") return "New";
    if (type === "used_clean") return "Used";
    if (type === "used_salvage") return "Used (Salvaged)";
    return type;
  }
  // ===== Auto-update expiration when start date changes =====
  useEffect(() => {
    if (!newRegStart) return;

    // Compute expiration = +12 months
    const d = new Date(newRegStart);
    d.setFullYear(d.getFullYear() + 1);
    const autoExp = d.toISOString().split("T")[0];

    // Only set expiration automatically if user has not modified it manually
    setNewRegDate((prev) => prev || autoExp);
  }, [newRegStart]);



  if (!vehicle)
    return <div className="p-6 text-center text-lg">Loading...</div>;

  const importanceOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const severityOrder: Record<string, number> = {
    red: 4,
    orange: 3,
    yellow: 2,
    green: 1,
  };
  const sortedUpcoming = [...upcoming].sort((a, b) => {
    if (sortOption === "importance") {
      return (importanceOrder[b.fixed_severity] ?? 0) -
            (importanceOrder[a.fixed_severity] ?? 0);
    } else {
      return (severityOrder[b.severity] ?? 0) -
            (severityOrder[a.severity] ?? 0);
    }
  });

  const formattedPurchaseDate = new Date(vehicle.purchase_date).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  function openPart(part: any) {
    setSelectedPart(part);
    loadAttachments(part.id);
  }

  async function submitLoan() {
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `/api/vehicles/${vehicleId}/loan`,
        {
          lender: loanForm.lender,
          start_date: loanForm.start_date,
          term_months: Number(loanForm.term_months),
          interest_rate: Number(loanForm.interest_rate),
          notes: loanForm.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowLoanModal(false);

      // Reload loan info
      const res = await axios.get(`/api/vehicles/${vehicleId}/loan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoanInfo(res.data);

    } catch (err) {
      console.error("Failed to save loan:", err);
      alert("Could not save loan.");
    }
  }

  async function saveOdometer() {
    if (!odoMileage) return alert("Mileage is required.");

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `/api/vehicles/${vehicleId}/odometer`,
        {
          date: odoDate,
          mileage: Number(odoMileage),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh latest odometer
      const res = await axios.get(`/api/vehicles/${vehicleId}/odometer/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLatestOdometer(res.data);

      // Close modal
      setShowOdoModal(false);
      setOdoMileage("");
      setOdoDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error(err);
      alert("Failed to save odometer.");
    }
  }

  async function handleSaveRegistration() {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `/api/vehicles/${vehicleId}/registration`,
        {
          start_date: newRegStart,   // <-- must be provided
          expiration_date: newRegDate,   // optional (backend will auto-set if missing)
          state: newRegState,
          notes: newRegNotes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowRegModal(false);

      // Reload registration info
      const res = await axios.get(`/api/vehicles/${vehicleId}/registration/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLatestRegistration(res.data);
      // Load registration attachments
      if (res.data?.id) {
        const aRes = await axios.get(
          `/api/registrations/${res.data.id}/attachments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRegAttachments(aRes.data);
    }


    } catch (err) {
      console.error(err);
      alert("Failed to save registration.");
    }
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
  async function handleAddRegAttachment(e: any) {
    const file = e.target.files?.[0];
    if (!file || !latestRegistration?.registration_id) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(
        `/api/vehicles/${vehicleId}/registration/${latestRegistration.registration_id}/attachments`,
        formData,
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Push newly uploaded attachment into state
      setRegAttachments((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload attachment.");
    }
  }


  const registrationExists = !!latestRegistration;

  const registrationValid = registrationExists
    ? new Date(latestRegistration.expiration_date) >= new Date()
    : false;

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
      <div className={`flex-1 overflow-y-auto ${activeTab === "upcoming" ? "pt-0" : "pt-4"} px-4 pb-4`}>

        {/* ========================================================= */}
        {/* ====================== OVERVIEW TAB ===================== */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div>
            {/* ===== VEHICLE SUMMARY CARD ===== */}
            <div className="bg-white shadow px-4 py-4 rounded-xl relative">
              {/* REGISTRATION BADGE */}
              <button
                onClick={() => setShowRegModal(true)}
                className={`
                  absolute top-3 right-3 z-20 cursor-pointer
                  px-3 py-2 flex items-center gap-2
                  text-xs font-semibold shadow-md rounded-md border
                  ${
                    registrationExists
                      ? registrationValid
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-red-100 text-red-700 border-red-300"
                      : "bg-gray-100 text-gray-600 border-gray-300"
                  }
                `}
              >
                <FaRegFileAlt className="text-sm" />

                {registrationExists
                  ? registrationValid
                    ? "Registration Valid"
                    : "Registration Expired"
                  : "Add Registration"}
              </button>
              {showRegModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                  <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">

                    {/* CLOSE BUTTON */}
                    <button
                      onClick={() => setShowRegModal(false)}
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ×
                    </button>

                    <h2 className="text-xl font-bold mb-4">
                      {registrationExists ? "Vehicle Registration" : "Add Registration"}
                    </h2>

                    {/* IF REGISTRATION EXISTS — DETAILS */}
                    {registrationExists && (
                      <div className="space-y-2 text-gray-700">
                        <p>
                          <b>Start Date:</b>{" "}
                          {new Date(latestRegistration.registration_date).toLocaleDateString()}
                        </p>

                        <p>
                          <b>Expiration:</b>{" "}
                          {new Date(latestRegistration.expiration_date).toLocaleDateString()}
                        </p>

                        {latestRegistration.notes && (
                          <p><b>Notes:</b> {latestRegistration.notes}</p>
                        )}

                        {/* ATTACHMENTS LIST */}
                        {regAttachments.length > 0 && (
                          <div>
                            <p className="font-semibold mb-1">Attachments</p>
                            <div className="grid grid-cols-3 gap-3">
                              {regAttachments.map((a) => (
                                <img
                                  key={a.id}
                                  src={a.url}
                                  className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => setFullImage(a.url)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ADD ATTACHMENT */}
                        <button
                          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          + Add Attachment
                        </button>

                        {/* Hidden File Input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAddRegAttachment}
                        />
                      </div>
                    )}

                    {/* IF NO REGISTRATION — SHOW FORM */}
                    {!registrationExists && (
                      <div className="space-y-4">

                        {/* Start Date */}
                        <div>
                          <label className="block font-semibold mb-1">Start Date</label>
                          <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={newRegStart}
                            onChange={(e) => {
                              const start = e.target.value;
                              setNewRegStart(start);

                              // Auto-set expiration to +1 year
                              if (start) {
                                const d = new Date(start);
                                d.setFullYear(d.getFullYear() + 1);
                                setNewRegDate(d.toISOString().split("T")[0]);
                              }
                            }}
                          />
                        </div>


                        {/* Expiration Date */}
                        <div>
                          <label className="block font-semibold mb-1">Expiration Date</label>
                          <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={newRegDate}
                            onChange={(e) => setNewRegDate(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-set to 1 year after start, but you may edit it.
                          </p>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">State</label>
                          <select
                            className="w-full border rounded px-3 py-2"
                            value={newRegState}
                            onChange={(e) => setNewRegState(e.target.value)}
                          >
                            <option value="AL">Alabama</option>
                            <option value="AK">Alaska</option>
                            <option value="AZ">Arizona</option>
                            <option value="AR">Arkansas</option>
                            <option value="CA">California</option>
                            <option value="CO">Colorado</option>
                            <option value="CT">Connecticut</option>
                            <option value="DE">Delaware</option>
                            <option value="FL">Florida</option>
                            <option value="GA">Georgia</option>
                            <option value="HI">Hawaii</option>
                            <option value="ID">Idaho</option>
                            <option value="IL">Illinois</option>
                            <option value="IN">Indiana</option>
                            <option value="IA">Iowa</option>
                            <option value="KS">Kansas</option>
                            <option value="KY">Kentucky</option>
                            <option value="LA">Louisiana</option>
                            <option value="ME">Maine</option>
                            <option value="MD">Maryland</option>
                            <option value="MA">Massachusetts</option>
                            <option value="MI">Michigan</option>
                            <option value="MN">Minnesota</option>
                            <option value="MS">Mississippi</option>
                            <option value="MO">Missouri</option>
                            <option value="MT">Montana</option>
                            <option value="NE">Nebraska</option>
                            <option value="NV">Nevada</option>
                            <option value="NH">New Hampshire</option>
                            <option value="NJ">New Jersey</option>
                            <option value="NM">New Mexico</option>
                            <option value="NY">New York</option>
                            <option value="NC">North Carolina</option>
                            <option value="ND">North Dakota</option>
                            <option value="OH">Ohio</option>
                            <option value="OK">Oklahoma</option>
                            <option value="OR">Oregon</option>
                            <option value="PA">Pennsylvania</option>
                            <option value="RI">Rhode Island</option>
                            <option value="SC">South Carolina</option>
                            <option value="SD">South Dakota</option>
                            <option value="TN">Tennessee</option>
                            <option value="TX">Texas</option>
                            <option value="UT">Utah</option>
                            <option value="VT">Vermont</option>
                            <option value="VA">Virginia</option>
                            <option value="WA">Washington</option>
                            <option value="WV">West Virginia</option>
                            <option value="WI">Wisconsin</option>
                            <option value="WY">Wyoming</option>

                            {/* Optional: Washington DC */}
                            <option value="DC">District of Columbia</option>
                          </select>
                        </div>


                        {/* Notes */}
                        <div>
                          <label className="block font-semibold mb-1">Notes (optional)</label>
                          <textarea
                            className="w-full border rounded px-3 py-2"
                            value={newRegNotes}
                            onChange={(e) => setNewRegNotes(e.target.value)}
                          />
                        </div>

                        {/* Save */}
                        <button
                          onClick={handleSaveRegistration}
                          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          Save Registration
                        </button>

                      </div>
                    )}
                  </div>
                </div>
              )}




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
                <div className="flex-1 flex flex-col text-gray-700">

                  {/* Nickname */}
                  {vehicle.nickname && (
                    <p className="text-lg font-semibold italic mb-1">
                      “{vehicle.nickname}”
                    </p>
                  )}

                  {/* ALWAYS SHOW TRIM */}
                  <p className="mb-2">
                    <span className="font-semibold">Trim:</span>{" "}
                    {vehicle.trim || "—"}
                  </p>

                  {/* ===== MOBILE DROPDOWN ===== */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setShowDetails((v) => !v)}
                      className="text-blue-600 text-sm mb-2 underline"
                    >
                      {showDetails ? "Hide Details" : "Show Details"}
                    </button>

                    {showDetails && (
                      <div className="space-y-1">
                        <p><span className="font-semibold">Color:</span> {vehicle.color || "—"}</p>
                        <p><span className="font-semibold">VIN:</span> {vehicle.vin || "—"}</p>
                        <p><span className="font-semibold">Plate:</span> {vehicle.plate || "—"}</p>
                        <p><span className="font-semibold">Purchased:</span> {formattedPurchaseDate}</p>
                        <p><span className="font-semibold">Type:</span> {formatPurchaseType(vehicle.purchase_type)}</p>
                      </div>
                    )}
                  </div>

                  {/* ===== DESKTOP FULL DETAIL VIEW ===== */}
                  <div className="hidden md:block space-y-1">
                    <p><span className="font-semibold">Color:</span> {vehicle.color || "—"}</p>
                    <p><span className="font-semibold">VIN:</span> {vehicle.vin || "—"}</p>
                    <p><span className="font-semibold">Plate:</span> {vehicle.plate || "—"}</p>
                    <p><span className="font-semibold">Purchased:</span> {formattedPurchaseDate}</p>
                    <p><span className="font-semibold">Type:</span> {formatPurchaseType(vehicle.purchase_type)}</p>
                  </div>

                </div>
              </div>
            </div>


            {/* ===== LATEST ODOMETER ===== */}
            <div className="bg-white shadow px-4 py-4 rounded-xl mt-1">
              <div className="flex items-center justify-between">
                <div>
                  {latestOdometer ? (
                    <p className="text-gray-700 mt-1">
                      <strong>Odometer: </strong>{latestOdometer.mileage.toLocaleString()} miles
                      <span className="text-gray-500 ml-2">
                        ({new Date(latestOdometer.date).toLocaleDateString()})
                      </span>
                    </p>
                  ) : (
                    <p className="text-gray-500 mt-1">No odometer entries yet.</p>
                  )}
                </div>

                {/* Add Button */}
                <button
                  onClick={() => setShowOdoModal(true)}
                  className="text-2xl font-bold text-gray-600 hover:text-black"
                >
                  +
                </button>
              </div>
            </div>

            {/* ===== VEHICLE LOAN STATUS ===== */}
            <div className="bg-white shadow px-4 py-4 rounded-xl mt-1 relative">
              <div className="flex items-center justify-between">

                {/* --- NO LOAN --- */}
                {!loanInfo?.loan && (
                  <>
                    <p className="text-gray-700">
                      No loan is associated with this vehicle.
                    </p>

                    <button
                      onClick={() => setShowLoanModal(true)}
                      className="p-2 hover:bg-gray-200 rounded"
                    >
                      <span className="text-2xl font-bold text-gray-600">+</span>
                    </button>
                  </>
                )}

                {/* --- LOAN EXISTS --- */}
                {loanInfo?.loan && (
                  <div className="w-full">

                    {/* Paid Off */}
                    {loanInfo.isPaidOff ? (
                      <p className="text-green-700 font-semibold flex items-center gap-2">
                        ✔ Loan was paid off on{" "}
                        {loanInfo.loan.paid_off_date ||
                          loanInfo.end_date}
                      </p>
                    ) : (
                      <>
                        <p className="text-gray-700 mb-2">
                          Loan with <strong>{loanInfo.loan.lender}</strong>
                        </p>

                        {/* PROGRESS BAR */}
                        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${loanInfo.progress}%` }}
                          />
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {loanInfo.progress.toFixed(1)}% of loan term completed
                        </p>
                      </>
                    )}
                  </div>
                )}
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
             {/* ===== VEHICLE REGISTRATION STATUS BANNER (FULL WIDTH) ===== */}
            {latestRegistration && (
              (() => {
                // --- Determine severity based on expiration date ---
                const today = new Date();
                const exp = new Date(latestRegistration.expiration_date);

                const diffMonths =
                  (exp.getFullYear() - today.getFullYear()) * 12 +
                  (exp.getMonth() - today.getMonth());

                const isPastDue = diffMonths < 0;
                const highRisk = diffMonths <= 1;
                const mediumRisk = diffMonths <= 3;

                let regSeverity: "red" | "orange" | "yellow" | "green" = "green";
                if (isPastDue) regSeverity = "red";
                else if (highRisk) regSeverity = "orange";
                else if (mediumRisk) regSeverity = "yellow";

                const style = severityStyles[regSeverity];

                return (
                  <div
                    className={`
                      w-[calc(100%+2rem)]   // full width + compensate for padding
                      ml-[-1rem]            // pull left
                      mr-[-1rem]            // pull right
                      px-2 py-2 mb-3 shadow border
                      ${style.bg} ${style.border}
                    `}
                  >

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-semibold ${style.text}`}>
                          Registration Status
                        </h3>

                        <p className="text-sm text-gray-700">
                          <b>Expires:</b>{" "}
                          {exp.toLocaleDateString()}
                        </p>
                      </div>

                      {/* Badge */}
                      <span
                        className={`
                          px-2 py-1 text-xs font-semibold rounded
                          ${style.badge}
                        `}
                      >
                        {isPastDue
                          ? "Expired"
                          : `Due in ${diffMonths} month${diffMonths === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  </div>
                );
              })()
            )}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Upcoming Maintenance</h2>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm text-gray-700 bg-white shadow-sm"
              >
                <option value="urgency">Sort by Urgency</option>
                <option value="importance">Sort by Importance</option>
              </select>
            </div>


            {upcoming.length === 0 && (
              <p className="text-gray-500">Nothing due soon!</p>
            )}
            

            <div className="space-y-1">
              {sortedUpcoming.map((fix) => {
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
                onClick={() => navigate(`/vehicles/${vehicleId}/vehicle-parts/${selectedPart.id}/edit`)}
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

      {showLoanModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">

          {/* Close */}
          <button
            onClick={() => setShowLoanModal(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>

          <h2 className="text-xl font-bold mb-4">Add Vehicle Loan</h2>

          {/* Form */}
          <div className="space-y-3">

            <div>
              <label className="block text-sm font-medium">Lender</label>
              <input
                className="w-full border rounded px-2 py-1 mt-1"
                value={loanForm.lender}
                onChange={(e) => setLoanForm({ ...loanForm, lender: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1 mt-1"
                value={loanForm.start_date}
                onChange={(e) => setLoanForm({ ...loanForm, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Term (Months)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 mt-1"
                value={loanForm.term_months}
                onChange={(e) => setLoanForm({ ...loanForm, term_months: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Interest Rate (%)</label>
              <input
                type="number"
                step="0.001"
                className="w-full border rounded px-2 py-1 mt-1"
                value={loanForm.interest_rate}
                onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                className="w-full border rounded px-2 py-1 mt-1"
                rows={2}
                value={loanForm.notes}
                onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={submitLoan}
            className="mt-5 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Save Loan
          </button>

        </div>
      </div>
    )}


      {showOdoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-xl shadow-xl relative">

            <h2 className="text-xl font-bold mb-4">Add Odometer Entry</h2>

            {/* FORM */}
            <div className="space-y-3">

              {/* DATE */}
              <div>
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={odoDate}
                  onChange={(e) => setOdoDate(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </div>

              {/* MILEAGE */}
              <div>
                <label className="text-sm font-medium">Mileage</label>
                <input
                  type="number"
                  value={odoMileage}
                  onChange={(e) => setOdoMileage(e.target.value)}
                  placeholder="Enter mileage"
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowOdoModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={saveOdometer}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
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
