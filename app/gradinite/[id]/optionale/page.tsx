"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2, Users, Search, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

interface ProgramSlot {
  zi: string;
  oraStart: string;
  oraEnd: string;
}

interface Optional {
  id: string;
  nume: string;
  pret: number;
  tipPret: "sedinta" | "lunar";
  icon: string;
  copii: Array<{
    id: string;
    numarSedinte?: number;
  }>;
  program?: ProgramSlot[];
  profesorId?: string;
  profesorNume?: string;
  profesorEmail?: string;
}

interface Child {
  id: string;
  nume: string;
  grupa: string;
}

export default function OptionalePage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [gradinita, setGradinita] = useState<any>(null);
  const [optionale, setOptionale] = useState<Optional[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [isEducatoare, setIsEducatoare] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [selectedOptional, setSelectedOptional] = useState<Optional | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    zi: string;
    ora: string;
  } | null>(null);
  const [editingEvent, setEditingEvent] = useState<ProgramSlot | null>(null);

  // Form states
  const [newOptional, setNewOptional] = useState({
    nume: "",
    pret: 0,
    tipPret: "lunar" as "sedinta" | "lunar",
    icon: "🎓",
    profesorNume: "",
    profesorEmail: "",
    profesorParola: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrupa, setSelectedGrupa] = useState("Toate");
  const [selectedChildren, setSelectedChildren] = useState<
    Array<{ id: string; numarSedinte?: number }>
  >([]);

  const iconOptions = [
    "💃",
    "🥋",
    "🎹",
    "🇬🇧",
    "⚽",
    "🎨",
    "🎭",
    "🎸",
    "🏊",
    "🎓",
  ];

  // Calendar constants
  const zile = ["Luni", "Marți", "Miercuri", "Joi", "Vineri"];
  const ore = Array.from({ length: 11 }, (_, i) => `${8 + i}:00`); // 8:00 - 18:00
  const culoriOptionale = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      let orgId = user.uid;
      let isEdu = false;

      // Check if user is educatoare
      const educatoareRef = doc(db, "educatoare", user.uid);
      const educatoareSnap = await getDoc(educatoareRef);

      if (educatoareSnap.exists()) {
        // User is educatoare
        const educatoareData = educatoareSnap.data();
        orgId = educatoareData.organizationId;
        isEdu = true;
        setIsEducatoare(true);
      }

      setOrganizationId(orgId);

      // Load gradinita
      const gradinitaRef = doc(
        db,
        "organizations",
        orgId,
        "locations",
        gradinitaId,
      );
      const gradinitaSnap = await getDoc(gradinitaRef);
      if (gradinitaSnap.exists()) {
        setGradinita(gradinitaSnap.data());
      }

      // Load optionale
      const optionaleRef = collection(
        db,
        "organizations",
        orgId,
        "locations",
        gradinitaId,
        "optionale",
      );
      const optionaleSnap = await getDocs(optionaleRef);
      const optionaleData = optionaleSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Optional[];
      setOptionale(optionaleData);

      // Load children
      const childrenRef = collection(
        db,
        "organizations",
        orgId,
        "locations",
        gradinitaId,
        "children",
      );
      const childrenSnap = await getDocs(childrenRef);
      const childrenData = childrenSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Child[];
      setChildren(childrenData);
    } catch (error) {
      console.error("Eroare încărcare date:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOptional = async () => {
    try {
      if (!organizationId) return;

      if (!newOptional.nume || newOptional.pret <= 0) {
        alert("Te rugăm să complețezi toate câmpurile!");
        return;
      }

      if (
        !newOptional.profesorNume ||
        !newOptional.profesorEmail ||
        !newOptional.profesorParola
      ) {
        alert("Te rugăm să complețezi datele profesorului!");
        return;
      }

      // Creează opționalul mai întâi
      const optionaleRef = collection(
        db,
        "organizations",
        organizationId,
        "locations",
        gradinitaId,
        "optionale",
      );
      const optionalDoc = await addDoc(optionaleRef, {
        nume: newOptional.nume,
        pret: newOptional.pret,
        tipPret: newOptional.tipPret,
        icon: newOptional.icon,
        copii: [],
        profesorNume: newOptional.profesorNume,
        profesorEmail: newOptional.profesorEmail,
        createdAt: new Date(),
      });

      // Creează cont profesor prin API (fără să deconecteze utilizatorul curent)
      const response = await fetch("/api/create-profesor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newOptional.profesorEmail,
          password: newOptional.profesorParola,
          nume: newOptional.profesorNume,
          organizationId: organizationId,
          locationId: gradinitaId,
          optionalId: optionalDoc.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Eroare la crearea profesorului");
      }

      // Actualizează opționalul cu profesorId
      await updateDoc(
        doc(
          db,
          "organizations",
          organizationId,
          "locations",
          gradinitaId,
          "optionale",
          optionalDoc.id,
        ),
        {
          profesorId: result.uid,
        },
      );

      setNewOptional({
        nume: "",
        pret: 0,
        tipPret: "lunar",
        icon: "🎓",
        profesorNume: "",
        profesorEmail: "",
        profesorParola: "",
      });
      setShowAddModal(false);
      loadData();
      alert("✅ Opțional adăugat cu succes!");
    } catch (error) {
      console.error("Eroare adăugare opțional:", error);
      alert("❌ Eroare la adăugarea opționalului");
    }
  };

  const handleDeleteOptional = async (optionalId: string, nume: string) => {
    if (!confirm(`Sigur vrei să ștergi opționalul "${nume}"?`)) return;

    try {
      if (!organizationId) return;

      await deleteDoc(
        doc(
          db,
          "organizations",
          organizationId,
          "locations",
          gradinitaId,
          "optionale",
          optionalId,
        ),
      );
      loadData();
      alert("✅ Opțional șters cu succes!");
    } catch (error) {
      console.error("Eroare ștergere:", error);
      alert("❌ Eroare la ștergerea opționalului");
    }
  };

  const handleOpenChildrenModal = (optional: Optional) => {
    // Setezăm tipPret default dacă lipsește (opționale vechi)
    const optionalWithDefaults = {
      ...optional,
      tipPret: optional.tipPret || ("lunar" as "sedinta" | "lunar"),
    };
    setSelectedOptional(optionalWithDefaults);

    // Convertim la noul format dacă există date vechi (string[])
    const copiiFormatati = (optional.copii || []).map((c) =>
      typeof c === "string" ? { id: c, numarSedinte: 8 } : c,
    );
    setSelectedChildren(copiiFormatati);
    setShowChildrenModal(true);
  };

  const handleSaveChildren = async () => {
    try {
      if (!organizationId || !selectedOptional) return;

      const optionalRef = doc(
        db,
        "organizations",
        organizationId,
        "locations",
        gradinitaId,
        "optionale",
        selectedOptional.id,
      );

      // Curățăm copiii - eliminăm câmpurile undefined pentru Firebase
      const copiiCurati = selectedChildren.map((c) => {
        const copilCurat: any = { id: c.id };
        if (c.numarSedinte !== undefined) {
          copilCurat.numarSedinte = c.numarSedinte;
        }
        return copilCurat;
      });

      // Actualizăm copiii și ne asigurăm că tipPret există
      const updateData: any = {
        copii: copiiCurati,
      };

      // Dacă opționalul nu are tipPret, îl setăm la 'lunar' (default pentru opționale vechi)
      if (!selectedOptional.tipPret) {
        updateData.tipPret = "lunar";
      }

      await updateDoc(optionalRef, updateData);

      setShowChildrenModal(false);
      setSelectedOptional(null);
      setSelectedChildren([]);
      setSearchTerm("");
      loadData();
      alert("✅ Copii adăugați cu succes!");
    } catch (error) {
      console.error("Eroare salvare copii:", error);
      alert("❌ Eroare la salvarea copiilor");
    }
  };

  const toggleChild = (childId: string) => {
    setSelectedChildren((prev) => {
      const exists = prev.find((c) => c.id === childId);
      if (exists) {
        return prev.filter((c) => c.id !== childId);
      } else {
        return [
          ...prev,
          {
            id: childId,
            numarSedinte:
              (selectedOptional?.tipPret || "lunar") === "sedinta"
                ? 8
                : undefined,
          },
        ];
      }
    });
  };

  const updateNumarSedinte = (childId: string, numar: number) => {
    setSelectedChildren((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, numarSedinte: numar } : c)),
    );
  };

  // Calendar functions
  const handleOpenProgramModal = (zi: string, ora: string) => {
    setSelectedSlot({ zi, ora });
    setShowProgramModal(true);
  };

  const handleAddProgram = async (
    optionalId: string,
    oraStart: string,
    oraEnd: string,
  ) => {
    try {
      if (!organizationId || !selectedSlot) return;

      const optional = optionale.find((o) => o.id === optionalId);
      if (!optional) return;

      const newSlot: ProgramSlot = {
        zi: selectedSlot.zi,
        oraStart,
        oraEnd,
      };

      const updatedProgram = [...(optional.program || []), newSlot];

      const optionalRef = doc(
        db,
        "organizations",
        organizationId,
        "locations",
        gradinitaId,
        "optionale",
        optionalId,
      );
      await updateDoc(optionalRef, {
        program: updatedProgram,
      });

      setShowProgramModal(false);
      setSelectedSlot(null);
      loadData();
      alert("✅ Program adăugat cu succes!");
    } catch (error) {
      console.error("Eroare adăugare program:", error);
      alert("❌ Eroare la adăugarea programului");
    }
  };

  const handleDeleteProgram = async (optionalId: string, slot: ProgramSlot) => {
    if (
      !confirm(
        `Sigur vrei să ștergi ${slot.zi} ${slot.oraStart}-${slot.oraEnd}?`,
      )
    )
      return;

    try {
      if (!organizationId) return;

      const optional = optionale.find((o) => o.id === optionalId);
      if (!optional) return;

      const updatedProgram = (optional.program || []).filter(
        (s) =>
          !(
            s.zi === slot.zi &&
            s.oraStart === slot.oraStart &&
            s.oraEnd === slot.oraEnd
          ),
      );

      const optionalRef = doc(
        db,
        "organizations",
        organizationId,
        "locations",
        gradinitaId,
        "optionale",
        optionalId,
      );
      await updateDoc(optionalRef, {
        program: updatedProgram,
      });

      loadData();
      alert("✅ Program șters cu succes!");
    } catch (error) {
      console.error("Eroare ștergere program:", error);
      alert("❌ Eroare la ștergerea programului");
    }
  };

  const getEventAtSlot = (zi: string, ora: string) => {
    for (const optional of optionale) {
      if (!optional.program) continue;

      for (const slot of optional.program) {
        if (slot.zi === zi) {
          const slotStart = parseInt(slot.oraStart.split(":")[0]);
          const slotEnd = parseInt(slot.oraEnd.split(":")[0]);
          const currentOra = parseInt(ora.split(":")[0]);

          if (currentOra >= slotStart && currentOra < slotEnd) {
            return { optional, slot, isStart: currentOra === slotStart };
          }
        }
      }
    }
    return null;
  };

  const getOptionalColor = (optionalId: string) => {
    const index = optionale.findIndex((o) => o.id === optionalId);
    return culoriOptionale[index % culoriOptionale.length];
  };

  const filteredChildren = children.filter((child) => {
    const matchesSearch = child.nume
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGrupa =
      selectedGrupa === "Toate" || child.grupa === selectedGrupa;
    return matchesSearch && matchesGrupa;
  });

  const grupe = ["Toate", ...Array.from(new Set(children.map((c) => c.grupa)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">🎓 Opționale</h1>
                <p className="text-white/90">{gradinita?.name}</p>
              </div>
              {!isEducatoare && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adaugă Opțional
                </button>
              )}
            </div>
          </div>

          {/* Optionale Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {optionale.map((optional) => (
              <div
                key={optional.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition border-2 border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{optional.icon}</div>
                  {!isEducatoare && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleDeleteOptional(optional.id, optional.nume)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {optional.nume}
                </h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">
                  {optional.pret} lei
                  {(optional.tipPret || "lunar") === "sedinta"
                    ? "/ședință"
                    : "/lună"}
                </p>
                {(optional.tipPret || "lunar") === "sedinta" && (
                  <p className="text-sm text-gray-600 mb-4">
                    💡 Prețul final depinde de numărul de ședințe/copil
                  </p>
                )}

                {!optional.tipPret || optional.tipPret === "lunar" ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Users className="w-4 h-4" />
                    <span>{optional.copii?.length || 0} copii înscriși</span>
                  </div>
                ) : (
                  <div className="h-6 mb-4"></div>
                )}

                <button
                  onClick={() => handleOpenChildrenModal(optional)}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Gestionează Copii
                </button>
              </div>
            ))}

            {optionale.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 mb-4">
                  Nu există opționale create încă
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
                >
                  Adaugă Primul Opțional
                </button>
              </div>
            )}
          </div>

          {/* Calendar Săptămânal */}
          {optionale.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📅 Program Săptămânal
              </h2>

              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header cu zilele */}
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    <div className="text-sm font-semibold text-gray-600 p-2">
                      Ora
                    </div>
                    {zile.map((zi) => (
                      <div
                        key={zi}
                        className="text-sm font-semibold text-gray-900 p-2 text-center bg-gray-100 rounded-lg"
                      >
                        {zi}
                      </div>
                    ))}
                  </div>

                  {/* Grid cu ore și evenimente */}
                  {ore.map((ora) => (
                    <div key={ora} className="grid grid-cols-6 gap-2 mb-2">
                      <div className="text-sm text-gray-600 p-2 font-medium">
                        {ora}
                      </div>
                      {zile.map((zi) => {
                        const event = getEventAtSlot(zi, ora);

                        if (event && event.isStart) {
                          const color = getOptionalColor(event.optional.id);
                          const duration =
                            parseInt(event.slot.oraEnd.split(":")[0]) -
                            parseInt(event.slot.oraStart.split(":")[0]);

                          return (
                            <div
                              key={zi}
                              className={`${color} text-white p-2 rounded-lg cursor-pointer hover:opacity-90 transition flex flex-col justify-between`}
                              style={{ gridRow: `span ${duration}` }}
                              onClick={() =>
                                handleDeleteProgram(
                                  event.optional.id,
                                  event.slot,
                                )
                              }
                            >
                              <div>
                                <p className="font-bold text-sm">
                                  {event.optional.icon} {event.optional.nume}
                                </p>
                                <p className="text-xs opacity-90">
                                  {event.slot.oraStart} - {event.slot.oraEnd}
                                </p>
                              </div>
                              <button className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded mt-1">
                                🗑️ Șterge
                              </button>
                            </div>
                          );
                        } else if (event && !event.isStart) {
                          return <div key={zi} />;
                        } else {
                          return (
                            <button
                              key={zi}
                              onClick={() => handleOpenProgramModal(zi, ora)}
                              className="border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 rounded-lg p-2 transition text-gray-400 hover:text-purple-600 text-xs"
                            >
                              +
                            </button>
                          );
                        }
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Optional Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Adaugă Opțional
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nume Opțional
                </label>
                <input
                  type="text"
                  value={newOptional.nume}
                  onChange={(e) =>
                    setNewOptional({ ...newOptional, nume: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Ex: Dans, Karate, Pian..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tip Preț
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipPret"
                      value="lunar"
                      checked={newOptional.tipPret === "lunar"}
                      onChange={() =>
                        setNewOptional({ ...newOptional, tipPret: "lunar" })
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span>Abonament lunar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipPret"
                      value="sedinta"
                      checked={newOptional.tipPret === "sedinta"}
                      onChange={() =>
                        setNewOptional({ ...newOptional, tipPret: "sedinta" })
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span>Preț per ședință</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preț (
                  {newOptional.tipPret === "sedinta"
                    ? "lei/ședință"
                    : "lei/lună"}
                  )
                </label>
                <input
                  type="number"
                  value={newOptional.pret}
                  onChange={(e) =>
                    setNewOptional({
                      ...newOptional,
                      pret: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Ex: 50, 100, 150..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewOptional({ ...newOptional, icon })}
                      className={`text-3xl p-3 rounded-lg border-2 transition ${
                        newOptional.icon === icon
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Separator */}
              <div className="border-t-2 border-gray-200 my-4"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                👨‍🏫 Date Profesor
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nume Profesor
                </label>
                <input
                  type="text"
                  value={newOptional.profesorNume}
                  onChange={(e) =>
                    setNewOptional({
                      ...newOptional,
                      profesorNume: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Ex: Ion Popescu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Profesor
                </label>
                <input
                  type="email"
                  value={newOptional.profesorEmail}
                  onChange={(e) =>
                    setNewOptional({
                      ...newOptional,
                      profesorEmail: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="profesor@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parolă Temporară
                </label>
                <input
                  type="password"
                  value={newOptional.profesorParola}
                  onChange={(e) =>
                    setNewOptional({
                      ...newOptional,
                      profesorParola: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Minim 6 caractere"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Profesorul va putea schimba parola după prima autentificare
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddOptional}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
                >
                  Adaugă
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Anulează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Children Selection Modal */}
      {showChildrenModal && selectedOptional && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedOptional.icon} {selectedOptional.nume}
                </h2>
                <button
                  onClick={() => {
                    setShowChildrenModal(false);
                    setSearchTerm("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Caută copil..."
                />
              </div>

              {/* Filter */}
              <select
                value={selectedGrupa}
                onChange={(e) => setSelectedGrupa(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                {grupe.map((grupa) => (
                  <option key={grupa} value={grupa}>
                    {grupa}
                  </option>
                ))}
              </select>
            </div>

            {/* Children List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredChildren.map((child) => (
                  <label
                    key={child.id}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChildren.some((c) => c.id === child.id)}
                      onChange={() => toggleChild(child.id)}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {child.nume}
                      </p>
                      <p className="text-sm text-gray-600">{child.grupa}</p>

                      {(selectedOptional.tipPret || "lunar") === "sedinta" &&
                        selectedChildren.some((c) => c.id === child.id) && (
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-xs text-gray-600">
                              Ședințe/lună:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={
                                selectedChildren.find((c) => c.id === child.id)
                                  ?.numarSedinte || 8
                              }
                              onChange={(e) =>
                                updateNumarSedinte(
                                  child.id,
                                  parseInt(e.target.value) || 8,
                                )
                              }
                              className="w-16 px-2 py-1 border-2 border-gray-300 rounded text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                    </div>
                    {selectedOptional.copii?.some((c: any) =>
                      typeof c === "string"
                        ? c === child.id
                        : c.id === child.id,
                    ) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        ✓ Înscris
                      </span>
                    )}
                  </label>
                ))}

                {filteredChildren.length === 0 && (
                  <p className="text-center text-gray-600 py-8">
                    Nu s-au găsit copii
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t">
              <div className="flex gap-3">
                <button
                  onClick={handleSaveChildren}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
                >
                  Salvează ({selectedChildren.length} selectați)
                </button>
                <button
                  onClick={() => {
                    setShowChildrenModal(false);
                    setSearchTerm("");
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Anulează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Modal */}
      {showProgramModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Adaugă în Program
              </h2>
              <button
                onClick={() => {
                  setShowProgramModal(false);
                  setSelectedSlot(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Zi:{" "}
                <span className="font-bold text-gray-900">
                  {selectedSlot.zi}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Ora start:{" "}
                <span className="font-bold text-gray-900">
                  {selectedSlot.ora}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              {optionale.map((optional) => (
                <div
                  key={optional.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{optional.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900">{optional.nume}</p>
                      <p className="text-sm text-gray-600">
                        {optional.pret} lei
                        {(optional.tipPret || "lunar") === "sedinta"
                          ? "/ședință"
                          : "/lună"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <select
                      id={`oraEnd-${optional.id}`}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selectează ora sfârșit
                      </option>
                      {ore
                        .filter(
                          (o) =>
                            parseInt(o.split(":")[0]) >
                            parseInt(selectedSlot.ora.split(":")[0]),
                        )
                        .map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById(
                          `oraEnd-${optional.id}`,
                        ) as HTMLSelectElement;
                        const oraEnd = select.value;
                        if (oraEnd) {
                          handleAddProgram(
                            optional.id,
                            selectedSlot.ora,
                            oraEnd,
                          );
                        } else {
                          alert("Te rugăm să selectezi ora sfârșit!");
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition text-sm"
                    >
                      Adaugă
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowProgramModal(false);
                setSelectedSlot(null);
              }}
              className="w-full mt-4 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
            >
              Anulează
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
