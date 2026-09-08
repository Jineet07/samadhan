import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  MapPin, Upload, Sparkles, ShieldCheck, GraduationCap, Users, Factory, FlaskConical,
  Rocket, BarChart3, Bell, Search, ChevronRight, ChevronDown, Check, X, Plus, ArrowRight,
  AlertTriangle, Building2, Lightbulb, Target, FileText, Beaker, Award, Home, Send,
  Layers, TrendingUp, Droplets, Loader2, CircleDot, Clock, UserPlus, Handshake, LogIn,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

/* ============================================================================
   SAMADHAN — Societal Innovation Collaboration Portal
   Working prototype. Client-side state, no server.
   Auth is a role switcher, not real auth. The AI layer calls Claude live and
   falls back to a deterministic offline analyzer if the network is unavailable.
   ========================================================================== */

/* ---------------------------------- data --------------------------------- */

const STORE_KEY = "samadhan:state:v1";

const SECTORS = [
  "Agriculture", "Healthcare", "Education", "Environment", "Water", "Energy",
  "Waste Management", "Transportation", "Rural Development", "Urban Development",
  "Public Safety", "Accessibility", "Digital Governance", "Climate", "Employment",
];

const SECTOR_KEYWORDS = {
  Water: ["water", "borewell", "well", "aquifer", "groundwater", "tanker", "scarcity", "drinking", "tap", "rainwater", "wastewater", "sewage", "effluent"],
  Agriculture: ["crop", "farmer", "farm", "stubble", "harvest", "irrigation", "soil", "fertiliser", "fertilizer", "yield", "agri", "residue"],
  Healthcare: ["health", "clinic", "hospital", "doctor", "patient", "medicine", "phc", "diagnosis", "maternal", "ambulance"],
  Education: ["school", "student", "dropout", "teacher", "classroom", "literacy", "learning", "syllabus"],
  Environment: ["pollution", "air", "biodiversity", "forest", "river", "contamination", "ecology"],
  Energy: ["electricity", "solar", "power", "grid", "diesel", "renewable", "battery", "outage"],
  "Waste Management": ["waste", "plastic", "garbage", "landfill", "segregation", "recycl", "dump", "compost"],
  Transportation: ["traffic", "bus", "road", "congestion", "commute", "transit", "junction", "signal"],
  "Rural Development": ["village", "panchayat", "rural", "hamlet", "gram"],
  "Urban Development": ["city", "municipal", "urban", "ward", "slum", "housing", "drainage"],
  "Public Safety": ["accident", "crime", "safety", "fire", "disaster", "emergency", "flood", "warning"],
  Accessibility: ["disabled", "disability", "wheelchair", "ramp", "accessible", "elderly", "blind"],
  "Digital Governance": ["portal", "certificate", "paperwork", "e-governance", "record", "grievance", "digital"],
  Climate: ["climate", "heat", "monsoon", "drought", "carbon", "emission", "cyclone"],
  Employment: ["job", "unemploy", "livelihood", "skill", "wage", "income", "training"],
};

const SDGS = [
  { n: 2, t: "Zero Hunger" }, { n: 3, t: "Good Health" }, { n: 4, t: "Quality Education" },
  { n: 6, t: "Clean Water & Sanitation" }, { n: 7, t: "Affordable Clean Energy" },
  { n: 8, t: "Decent Work" }, { n: 9, t: "Industry & Innovation" },
  { n: 11, t: "Sustainable Cities" }, { n: 12, t: "Responsible Consumption" },
  { n: 13, t: "Climate Action" }, { n: 15, t: "Life on Land" },
];

const SECTOR_SDG = {
  Water: [6, 11], Agriculture: [2, 12], Healthcare: [3], Education: [4],
  Environment: [15, 13], Energy: [7, 13], "Waste Management": [12, 11],
  Transportation: [11, 9], "Rural Development": [11, 8], "Urban Development": [11],
  "Public Safety": [11, 13], Accessibility: [10, 11], "Digital Governance": [9, 16],
  Climate: [13], Employment: [8],
};

const SECTOR_EXPERTISE = {
  Water: ["Water Resources Engineering", "Environmental Engineering", "IoT Sensing", "Hydrogeology"],
  Agriculture: ["Agricultural Engineering", "Soil Science", "Machine Learning", "Supply Chain"],
  Healthcare: ["Biomedical Engineering", "Public Health", "Telemedicine", "Data Science"],
  Education: ["Educational Technology", "Cognitive Science", "Software Engineering"],
  Environment: ["Environmental Engineering", "Remote Sensing", "Chemistry"],
  Energy: ["Renewable Energy", "Power Systems", "Energy Storage", "Electrical Engineering"],
  "Waste Management": ["Chemical Engineering", "Materials Science", "Circular Economy", "Logistics"],
  Transportation: ["Transportation Planning", "Computer Vision", "Civil Engineering"],
  "Rural Development": ["Development Studies", "Civil Engineering", "Design Thinking"],
  "Urban Development": ["Urban Planning", "Civil Engineering", "GIS"],
  "Public Safety": ["Sensor Networks", "Hydrology", "Embedded Systems", "Data Science"],
  Accessibility: ["Human-Computer Interaction", "Mechanical Design", "Industrial Design"],
  "Digital Governance": ["Software Engineering", "Cybersecurity", "Public Policy"],
  Climate: ["Climate Modelling", "Remote Sensing", "Environmental Engineering"],
  Employment: ["Economics", "Skill Development", "Data Science"],
};

// Schematic India. Not survey-accurate — a navigable abstraction for drill-down.
const REGIONS = [
  { id: "NR", name: "Uttarakhand & HP", pts: "120,25 165,18 190,40 175,70 140,78 108,62", districts: ["Dehradun", "Shimla", "Nainital"] },
  { id: "PB", name: "Punjab & Haryana", pts: "108,62 140,78 148,105 118,112 100,90", districts: ["Ludhiana", "Hisar", "Karnal"] },
  { id: "RJ", name: "Rajasthan", pts: "100,90 118,112 142,120 138,168 92,178 55,140 62,105", districts: ["Barmer", "Jaisalmer", "Jaipur", "Alwar"] },
  { id: "GJ", name: "Gujarat", pts: "92,178 138,168 132,205 108,238 62,232 38,200 55,178", districts: ["Kutch", "Banaskantha", "Ahmedabad", "Surat", "Valsad", "Rajkot", "Gandhinagar"] },
  { id: "UP", name: "Uttar Pradesh", pts: "148,105 190,95 232,112 228,150 176,158 142,120", districts: ["Lucknow", "Varanasi", "Gorakhpur", "Agra"] },
  { id: "BR", name: "Bihar & Jharkhand", pts: "232,112 268,120 282,155 258,190 222,178 228,150", districts: ["Patna", "Muzaffarpur", "Ranchi"] },
  { id: "WB", name: "West Bengal & NE", pts: "282,155 300,128 345,120 382,140 370,175 330,190 300,200 288,180", districts: ["Kolkata", "Jalpaiguri", "Guwahati"] },
  { id: "MP", name: "MP & Chhattisgarh", pts: "138,168 176,158 228,150 240,196 214,218 160,214 132,205", districts: ["Bhopal", "Indore", "Raipur", "Bastar"] },
  { id: "MH", name: "Maharashtra", pts: "108,238 132,205 160,214 200,222 196,262 150,278 104,262", districts: ["Pune", "Nagpur", "Nashik", "Mumbai Suburban"] },
  { id: "OD", name: "Odisha", pts: "240,196 258,190 278,205 268,242 226,240 214,218", districts: ["Puri", "Cuttack", "Koraput"] },
  { id: "AP", name: "Telangana & AP", pts: "196,262 214,218 226,240 246,268 232,318 196,332 168,300", districts: ["Hyderabad", "Guntur", "Warangal"] },
  { id: "KA", name: "Karnataka", pts: "150,278 196,262 168,300 174,340 138,352 112,318 118,282", districts: ["Bengaluru Rural", "Belagavi", "Kalaburagi"] },
  { id: "TN", name: "Tamil Nadu", pts: "174,340 196,332 218,352 206,404 172,412 152,372", districts: ["Chennai", "Madurai", "Coimbatore"] },
  { id: "KL", name: "Kerala", pts: "138,352 152,372 172,412 148,418 122,382 124,356", districts: ["Alappuzha", "Wayanad", "Kochi"] },
];

const centroid = (pts) => {
  const p = pts.split(" ").map((s) => s.split(",").map(Number));
  return [p.reduce((a, b) => a + b[0], 0) / p.length, p.reduce((a, b) => a + b[1], 0) / p.length];
};
const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

const UNIVERSITIES = [
  { id: "u1", name: "IIT Gandhinagar", region: "GJ", district: "Gandhinagar", depts: ["Civil", "Computer Science", "Earth Sciences", "Materials"], expertise: ["Water Resources Engineering", "IoT Sensing", "Machine Learning", "Hydrogeology", "Materials Science"], labs: ["Water & Climate Lab", "Sensing Systems Lab"], patents: 34, projects: 12, priorSocietal: 9 },
  { id: "u2", name: "Nirma University, Ahmedabad", region: "GJ", district: "Ahmedabad", depts: ["Civil", "Chemical", "Instrumentation"], expertise: ["Environmental Engineering", "Chemical Engineering", "Water Resources Engineering", "Circular Economy"], labs: ["Environmental Process Lab"], patents: 11, projects: 8, priorSocietal: 6 },
  { id: "u3", name: "SVNIT Surat", region: "GJ", district: "Surat", depts: ["Civil", "Mechanical", "Electrical"], expertise: ["Water Resources Engineering", "Civil Engineering", "Renewable Energy", "GIS"], labs: ["Hydraulics Lab", "Solar Test Bed"], patents: 7, projects: 10, priorSocietal: 7 },
  { id: "u4", name: "Anna University, Chennai", region: "TN", district: "Chennai", depts: ["Civil", "CSE", "Environmental"], expertise: ["Urban Planning", "Computer Vision", "Environmental Engineering", "Transportation Planning"], labs: ["Urban Mobility Lab"], patents: 22, projects: 15, priorSocietal: 11 },
  { id: "u5", name: "COEP Technological University, Pune", region: "MH", district: "Pune", depts: ["Mechanical", "Electrical", "Metallurgy"], expertise: ["Energy Storage", "Power Systems", "Embedded Systems", "Renewable Energy"], labs: ["Microgrid Lab"], patents: 15, projects: 9, priorSocietal: 5 },
];

const PARTNERS = [
  { id: "p1", name: "Tata Power Renewables", type: "Large Industry", sector: "Energy", expertise: ["Renewable Energy", "Power Systems"], csr: ["Rural electrification"], funding: "₹50L+", regions: ["GJ", "MH"] },
  { id: "p2", name: "Waterfield Technologies", type: "Startup", sector: "Water", expertise: ["IoT Sensing", "Water Resources Engineering"], csr: [], funding: "₹5-15L", regions: ["GJ"] },
  { id: "p3", name: "Sujal Pumps (MSME)", type: "MSME", sector: "Water", expertise: ["Mechanical Design", "Manufacturing"], csr: [], funding: "In-kind", regions: ["GJ", "RJ"] },
  { id: "p4", name: "Adani Foundation", type: "CSR Organization", sector: "Multi-sector", expertise: ["Community Mobilisation"], csr: ["Water", "Education", "Health"], funding: "₹1Cr+", regions: ["GJ", "RJ", "MP"] },
  { id: "p5", name: "CEPT Research & Development", type: "Research Institution", sector: "Urban", expertise: ["Urban Planning", "GIS"], csr: [], funding: "Grant-linked", regions: ["GJ"] },
  { id: "p6", name: "iHub Gujarat", type: "Innovation Hub", sector: "Multi-sector", expertise: ["Prototyping", "Incubation"], csr: [], funding: "₹10-25L", regions: ["GJ"] },
  { id: "p7", name: "GreenCycle Labs", type: "Startup", sector: "Waste Management", expertise: ["Circular Economy", "Materials Science"], csr: [], funding: "₹5-20L", regions: ["MH", "GJ"] },
  { id: "p8", name: "Larsen & Toubro Infra", type: "Large Industry", sector: "Infrastructure", expertise: ["Civil Engineering", "Transportation Planning"], csr: ["Skill development"], funding: "₹50L+", regions: ["TN", "MH", "GJ"] },
];

const FACULTY = [
  { id: "f1", name: "Dr. Anjali Mehta", uni: "u1", dept: "Civil", field: "Water Resources Engineering" },
  { id: "f2", name: "Dr. Rohit Desai", uni: "u1", dept: "Computer Science", field: "IoT Sensing" },
  { id: "f3", name: "Dr. Priya Nair", uni: "u2", dept: "Chemical", field: "Environmental Engineering" },
  { id: "f4", name: "Dr. S. Balaji", uni: "u4", dept: "CSE", field: "Computer Vision" },
  { id: "f5", name: "Dr. Meera Joshi", uni: "u5", dept: "Electrical", field: "Power Systems" },
  { id: "f6", name: "Dr. Kunal Shah", uni: "u3", dept: "Civil", field: "Hydraulics" },
  { id: "f7", name: "Dr. Farida Qureshi", uni: "u2", dept: "Instrumentation", field: "Sensor Networks" },
  { id: "f8", name: "Dr. Vivek Rao", uni: "u3", dept: "Mechanical", field: "Renewable Energy" },
  { id: "f9", name: "Dr. Neha Kulkarni", uni: "u5", dept: "Metallurgy", field: "Materials Science" },
  { id: "f10", name: "Dr. Arun Pillai", uni: "u4", dept: "Environmental", field: "Urban Planning" },
];

const STUDENT_NAMES = [
  ["Aarav Patel", "Computer Engineering"], ["Isha Trivedi", "Civil Engineering"],
  ["Rehan Shaikh", "Mechanical Engineering"], ["Diya Menon", "Environmental Science"],
  ["Kabir Rathod", "Electrical Engineering"], ["Ananya Bose", "Data Science"],
  ["Vihaan Chauhan", "Civil Engineering"], ["Sneha Iyer", "Chemical Engineering"],
  ["Yash Solanki", "Computer Engineering"], ["Tara Ghosh", "Public Policy"],
  ["Manav Jain", "Mechanical Engineering"], ["Ritika Verma", "Environmental Engineering"],
  ["Omkar Deshmukh", "Electronics"], ["Fatima Ansari", "Design"],
  ["Nikhil Reddy", "Computer Science"], ["Pooja Sharma", "Civil Engineering"],
  ["Arjun Nambiar", "Data Science"], ["Zara Khan", "Biotechnology"],
  ["Dev Chaudhary", "Mechanical Engineering"], ["Lakshmi Rao", "Urban Planning"],
];
const STUDENTS = STUDENT_NAMES.map(([name, dept], i) => ({
  id: "s" + (i + 1), name, dept, uni: UNIVERSITIES[i % 5].id, year: 2 + (i % 3),
}));

let uid = 100;
const nextId = () => "c" + ++uid;

const daysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);

const SEED_CHALLENGES = [
  ["Borewells running dry across 14 villages", "Groundwater in the taluka has dropped past 250 metres. Fourteen villages now depend on tanker supply for four months a year. Households, mostly women, spend three to four hours a day fetching drinking water.", "Water", "GJ", "Banaskantha", 18400, 5, 5, 34],
  ["Paddy stubble burning after every harvest", "Farmers burn crop residue because no collection route exists and machinery rental is unaffordable. Air quality collapses for six weeks each year.", "Agriculture", "PB", "Ludhiana", 240000, 4, 4, 21],
  ["Junction congestion on the ring road corridor", "Signal timing is fixed and does not respond to actual flow. Peak commute has grown from 25 to 70 minutes over three years.", "Transportation", "TN", "Chennai", 410000, 3, 4, 45],
  ["Plastic waste choking the creek", "Unsegregated municipal waste enters the creek at four points. No recovery system exists downstream and the fishing community reports falling catch.", "Waste Management", "MH", "Mumbai Suburban", 96000, 4, 4, 60],
  ["No doctor within 40 km of the tribal block", "The primary health centre has been unstaffed for eleven months. Emergency cases travel 40 km on unpaved road.", "Healthcare", "MP", "Bastar", 27000, 5, 5, 28],
  ["Village grid fails 9 hours a day", "Feeder is at the tail end of the distribution network. Voltage is too low to run irrigation pumps and shopfront refrigeration.", "Energy", "RJ", "Barmer", 12200, 4, 3, 52],
  ["No flood warning before the river crests", "The river rises in under six hours after upstream rain. Warning currently travels by phone call and reaches the last hamlet after water does.", "Public Safety", "BR", "Muzaffarpur", 68000, 5, 5, 18],
  ["Girls dropping out after class 8", "The nearest secondary school is 11 km away with no safe transport. Dropout among girls reached 38 percent last year.", "Education", "UP", "Gorakhpur", 4300, 4, 3, 70],
  ["Dyeing unit effluent entering farmland", "Untreated effluent from small textile units reaches irrigation channels. Soil salinity has risen and two crop cycles have failed.", "Environment", "GJ", "Surat", 31000, 5, 4, 40],
  ["Bus stops unusable for wheelchair users", "None of the 60 stops on the corridor have level boarding. Wheelchair users are effectively excluded from public transport.", "Accessibility", "KA", "Bengaluru Rural", 8900, 3, 2, 85],
  ["Land record corrections take 14 months", "Every mutation request moves on paper between three offices. Farmers cannot access credit while the record is disputed.", "Digital Governance", "MH", "Nashik", 52000, 3, 3, 95],
  ["Heat deaths rising in the old city wards", "Dense low-rise housing with metal roofing crosses 46°C indoors. Three wards recorded 19 heat deaths last summer.", "Climate", "GJ", "Ahmedabad", 74000, 5, 4, 26],
  ["Sewage discharged into the lake untreated", "The ward's treatment plant was designed for a third of the current load. Overflow reaches the lake daily.", "Water", "WB", "Kolkata", 130000, 4, 4, 55],
  ["Weaver cooperatives losing income to middlemen", "Handloom weavers sell at 40 percent of retail with no direct market access and no digital catalogue.", "Employment", "OD", "Cuttack", 3100, 3, 2, 78],
  ["Street lighting absent on the school route", "Two kilometres of the route to the girls' school have no lighting. Attendance in winter months drops sharply.", "Public Safety", "AP", "Warangal", 2600, 3, 3, 62],
];

const buildSeedChallenge = (row) => {
  const [title, description, sector, region, district, affected, severity, urgency, age] = row;
  const id = nextId();
  return {
    id, title, description, sector, subSector: "", region, district,
    affected, severity, urgency,
    expectedOutcome: "Reliable, locally maintainable solution validated with the community.",
    priorAttempts: "", evidence: [{ type: "image", name: "site-photo.jpg" }],
    sdgs: SECTOR_SDG[sector] || [], status: "Validated",
    submittedBy: "Citizen", submittedAt: daysAgo(age),
    ai: offlineAssess({ title, description, sector, region, district, affected, severity, urgency }, []),
    projectId: null, assignedUni: null,
  };
};

/* ------------------------------ AI: offline ------------------------------ */

const tokenize = (s) => (s || "").toLowerCase().match(/[a-z]{4,}/g) || [];
const STOP = new Set(["this", "that", "with", "from", "have", "been", "they", "there", "their", "which", "than", "then", "into", "over", "after", "before", "each", "year", "years", "past", "also", "reach", "reaches"]);

function jaccard(a, b) {
  const A = new Set(a.filter((t) => !STOP.has(t)));
  const B = new Set(b.filter((t) => !STOP.has(t)));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => B.has(t) && inter++);
  return inter / (A.size + B.size - inter);
}

function detectSector(text) {
  const t = text.toLowerCase();
  let best = "Rural Development", bestScore = 0;
  for (const [sector, kws] of Object.entries(SECTOR_KEYWORDS)) {
    const score = kws.reduce((a, k) => a + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = sector; }
  }
  return best;
}

function matchUniversities(sector, region, expertise) {
  return UNIVERSITIES.map((u) => {
    const overlap = u.expertise.filter((e) => expertise.includes(e));
    const local = u.region === region;
    const score = Math.min(98, overlap.length * 22 + (local ? 26 : 0) + Math.min(u.projects, 15) + u.priorSocietal);
    const reasons = [];
    if (overlap.length) reasons.push(`Departmental strength in ${overlap.slice(0, 2).join(" and ")}`);
    if (local) reasons.push(`Located in ${REGION_BY_ID[region]?.name}, prior fieldwork in the same region`);
    reasons.push(`${u.projects} related research projects and ${u.patents} filed patents`);
    if (u.labs.length) reasons.push(`Has ${u.labs[0]} available for prototyping`);
    return { id: u.id, name: u.name, score, reasons };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

function matchPartners(sector, region, expertise) {
  return PARTNERS.map((p) => {
    const overlap = p.expertise.filter((e) => expertise.includes(e));
    const local = p.regions.includes(region);
    const sectorHit = p.sector === sector || p.sector.startsWith("Multi") || p.csr.includes(sector);
    const score = overlap.length * 25 + (local ? 25 : 0) + (sectorHit ? 25 : 0);
    const reasons = [];
    if (sectorHit) reasons.push(`Active in the ${sector.toLowerCase()} sector`);
    if (overlap.length) reasons.push(`Brings ${overlap[0]} capability`);
    if (local) reasons.push(`Operates in ${REGION_BY_ID[region]?.name}`);
    reasons.push(`Typical support: ${p.funding}`);
    return { id: p.id, name: p.name, type: p.type, score, reasons };
  }).filter((p) => p.score > 25).sort((a, b) => b.score - a.score).slice(0, 3);
}

function offlineAssess(draft, existing) {
  const text = `${draft.title} ${draft.description}`;
  const sector = draft.sector && draft.sector !== "auto" ? draft.sector : detectSector(text);
  const expertise = SECTOR_EXPERTISE[sector] || ["Systems Engineering"];
  const affectedScore = Math.min(30, Math.log10(Math.max(draft.affected, 10)) * 6);
  const priority = Math.round(Math.min(99, Number(draft.severity) * 9 + Number(draft.urgency) * 9 + affectedScore));
  const impact = Math.round(Math.min(99, affectedScore * 2 + Number(draft.severity) * 7 + (SECTOR_SDG[sector]?.length || 1) * 4));
  const kw = [...new Set(tokenize(text).filter((t) => !STOP.has(t)))].slice(0, 8);
  const dupes = existing
    .map((c) => ({ id: c.id, title: c.title, district: c.district, score: Math.round(jaccard(tokenize(`${c.title} ${c.description}`), tokenize(text)) * 100) }))
    .filter((d) => d.score >= 12)
    .sort((a, b) => b.score - a.score).slice(0, 3);
  return {
    sector, priority, impact,
    urgency: ["", "Low", "Low", "Moderate", "High", "Critical"][Number(draft.urgency)] || "Moderate",
    expertise, sdgs: SECTOR_SDG[sector] || [], keywords: kw, duplicates: dupes,
    universities: matchUniversities(sector, draft.region, expertise),
    partners: matchPartners(sector, draft.region, expertise),
    source: "offline",
  };
}

/* ------------------------------ AI: live model --------------------------- */

async function liveAssess(draft, existing) {
  const catalogU = UNIVERSITIES.map((u) => `${u.id}|${u.name}|${REGION_BY_ID[u.region].name}|${u.expertise.join(",")}|${u.projects} projects`).join("\n");
  const catalogP = PARTNERS.map((p) => `${p.id}|${p.name}|${p.type}|${p.sector}|${p.expertise.join(",")}`).join("\n");
  const prompt = `You are the challenge triage engine for an Indian societal innovation portal.

CHALLENGE
Title: ${draft.title}
Description: ${draft.description}
Location: ${draft.district}, ${REGION_BY_ID[draft.region]?.name}
People affected: ${draft.affected}
Reported severity (1-5): ${draft.severity}
Reported urgency (1-5): ${draft.urgency}

UNIVERSITY CATALOG (id|name|region|expertise|activity)
${catalogU}

PARTNER CATALOG (id|name|type|sector|expertise)
${catalogP}

Categorise into exactly one of: ${SECTORS.join(", ")}.
Score priority and impact 0-100. Recommend the 3 best universities and up to 3 partners from the catalogs ONLY, each with 2-4 concrete, specific reasons referencing their expertise, region or activity.

Respond with ONLY this JSON object, no prose and no markdown fences:
{"sector":"","priority":0,"impact":0,"urgency":"Low|Moderate|High|Critical","expertise":[""],"sdgs":[6],"keywords":[""],"universities":[{"id":"","name":"","score":0,"reasons":[""]}],"partners":[{"id":"","name":"","type":"","score":0,"reasons":[""]}]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error("model unavailable");
  const data = await res.json();
  const text = data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  // Duplicate detection stays local: deterministic and instant.
  const dupes = existing
    .map((c) => ({ id: c.id, title: c.title, district: c.district, score: Math.round(jaccard(tokenize(`${c.title} ${c.description}`), tokenize(`${draft.title} ${draft.description}`)) * 100) }))
    .filter((d) => d.score >= 12).sort((a, b) => b.score - a.score).slice(0, 3);
  return { ...parsed, duplicates: dupes, source: "model" };
}

async function assess(draft, existing) {
  try {
    const withTimeout = Promise.race([
      liveAssess(draft, existing),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 25000)),
    ]);
    return await withTimeout;
  } catch {
    return offlineAssess(draft, existing);
  }
}

/* -------------------------------- projects ------------------------------- */

const STAGES = ["Team Formation", "Solution Proposal", "Approval", "Prototype", "Testing", "Pilot", "Implementation", "Impact Assessment", "Completed"];

const seedProject = (challenge, uni, opts = {}) => ({
  id: "pr" + challenge.id,
  challengeId: challenge.id,
  title: opts.title || `Solution for: ${challenge.title}`,
  uni, stage: opts.stage || "Team Formation",
  faculty: opts.faculty || null,
  team: opts.team || [],
  partner: opts.partner || null,
  budget: opts.budget || 0,
  milestones: opts.milestones || [
    { name: "Field survey complete", due: "Week 3", done: false },
    { name: "Prototype v1 built", due: "Week 8", done: false },
    { name: "Pilot approved", due: "Week 14", done: false },
  ],
  tasks: opts.tasks || [],
  solution: opts.solution || null,
  tests: opts.tests || [],
  pilot: opts.pilot || null,
  impact: opts.impact || null,
  ip: opts.ip || { patents: 0, papers: 0, startups: 0, tech: 0 },
  comments: opts.comments || [],
  log: opts.log || [],
});

/* ------------------------------ UI primitives ---------------------------- */

const cx = (...a) => a.filter(Boolean).join(" ");

const Card = ({ className = "", children, ...p }) => (
  <div {...p} className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>
);

const Btn = ({ variant = "primary", size = "md", className = "", children, ...p }) => {
  const v = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300",
    ghost: "text-slate-700 hover:bg-slate-100",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white",
    danger: "border border-red-200 text-red-700 hover:bg-red-50 bg-white",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  }[variant];
  const s = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" }[size];
  return (
    <button {...p} className={cx("inline-flex items-center gap-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed", v, s, className)}>
      {children}
    </button>
  );
};

const Badge = ({ tone = "slate", children, className = "" }) => {
  const t = {
    slate: "bg-slate-100 text-slate-700", indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-1 ring-red-200", blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", t, className)}>{children}</span>;
};

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const Stat = ({ label, value, sub, icon: Icon, tone = "indigo" }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {Icon && <div className={cx("rounded-lg p-2", tone === "indigo" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600")}><Icon size={18} /></div>}
    </div>
  </Card>
);

const statusTone = (s) => ({
  Draft: "slate", Submitted: "blue", "Under Validation": "amber", Validated: "green",
  Assigned: "indigo", "In Progress": "indigo", "Pilot Testing": "amber",
  Implemented: "green", Completed: "green", Rejected: "red",
}[s] || "slate");

const ScoreBar = ({ value, label, tone = "indigo" }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cx("h-full rounded-full", tone === "indigo" ? "bg-indigo-600" : "bg-emerald-500")} style={{ width: `${value}%` }} />
    </div>
  </div>
);

/* --------------------------------- map ----------------------------------- */

function IndiaMap({ mode = "view", selected, onSelect, counts = {}, height = 380 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="relative">
      <svg viewBox="0 0 400 440" style={{ height }} className="mx-auto block w-full max-w-md">
        {REGIONS.map((r) => {
          const c = counts[r.id] || 0;
          const intensity = mode === "view" ? c / max : 0;
          const isSel = selected === r.id;
          const fill = mode === "view"
            ? (c === 0 ? "#f1f5f9" : `rgba(79,70,229,${0.15 + intensity * 0.75})`)
            : isSel ? "#4f46e5" : hover === r.id ? "#c7d2fe" : "#e2e8f0";
          return (
            <g key={r.id}>
              <polygon
                points={r.pts} fill={fill}
                stroke={isSel ? "#312e81" : "#ffffff"} strokeWidth={isSel ? 2 : 1.2}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}
                onClick={() => onSelect && onSelect(r.id)}
              />
              {mode === "view" && c > 0 && (
                <text x={centroid(r.pts)[0]} y={centroid(r.pts)[1]} textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none fill-white text-xs font-semibold">{c}</text>
              )}
            </g>
          );
        })}
        {mode === "pick" && selected && (
          <g>
            <circle cx={centroid(REGION_BY_ID[selected].pts)[0]} cy={centroid(REGION_BY_ID[selected].pts)[1]} r="6" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow">
          {REGION_BY_ID[hover].name}{mode === "view" ? ` · ${counts[hover] || 0} challenges` : ""}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- demo guide ------------------------------ */

const DEMO_STEPS = [
  "Sign in as a citizen", "Submit a water challenge", "Attach evidence and pin the location",
  "AI analyses the submission", "AI categorises it as Water", "AI assigns priority and impact",
  "AI surfaces similar challenges", "AI recommends three universities", "Admin validates the challenge",
  "University accepts the assignment", "Faculty forms a multidisciplinary team", "Students join the team",
  "Industry partner discovers the project", "Partner commits mentorship and funding",
  "Team submits a solution proposal", "Reviewer approves the proposal", "Team logs prototype v1",
  "Testing results uploaded", "Pilot launched in the district", "Impact metrics recorded",
  "Project marked implemented", "Analytics dashboard reflects the outcome",
];

function DemoGuide({ done, open, setOpen }) {
  const count = done.size;
  return (
    <div className="fixed bottom-4 right-4 z-40 w-72">
      {open && (
        <Card className="mb-2 overflow-y-auto p-3" style={{ maxHeight: "60vh" }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Demo checklist</p>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
          </div>
          <ol className="space-y-1">
            {DEMO_STEPS.map((s, i) => (
              <li key={i} className={cx("flex items-start gap-2 rounded px-1.5 py-1 text-xs", done.has(i) ? "text-slate-400 line-through" : "text-slate-700")}>
                <span className={cx("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done.has(i) ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600")}>
                  {done.has(i) ? <Check size={10} /> : i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
      )}
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-slate-800">
        <span className="flex items-center gap-2"><CircleDot size={14} /> Demo flow</span>
        <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs">{count}/22</span>
      </button>
    </div>
  );
}

/* ================================== APP ================================== */

const ROLES = [
  { id: "citizen", label: "Citizen", icon: Users, org: "Resident, Banaskantha" },
  { id: "admin", label: "Government Validator", icon: ShieldCheck, org: "District Innovation Cell" },
  { id: "faculty", label: "Faculty / University", icon: GraduationCap, org: "IIT Gandhinagar" },
  { id: "student", label: "Student", icon: Users, org: "IIT Gandhinagar" },
  { id: "industry", label: "Industry Partner", icon: Factory, org: "Waterfield Technologies" },
];

const buildSeedProjects = (cs) => {
      const seedRefs = [cs[2], cs[3], cs[5], cs[8], cs[11], cs[9], cs[13], cs[14]];
      const built = [];
      const configs = [
        { stage: "Pilot", uni: "u4", partner: "p8", budget: 1800000 },
        { stage: "Testing", uni: "u5", partner: "p7", budget: 900000 },
        { stage: "Prototype", uni: "u3", partner: "p1", budget: 1200000 },
        { stage: "Solution Proposal", uni: "u2", partner: "p4", budget: 600000 },
        { stage: "Implementation", uni: "u1", partner: "p6", budget: 2400000 },
        { stage: "Completed", uni: "u4", partner: "p8", budget: 1500000, impact: { people: 8900, villages: 12, savings: 3400000, jobs: 40, env: "60 stops retrofitted for level boarding" }, ip: { patents: 1, papers: 2, startups: 0, tech: 1 } },
        { stage: "Completed", uni: "u2", partner: "p6", budget: 700000, impact: { people: 3100, villages: 7, savings: 1900000, jobs: 62, env: "Direct market access for 7 cooperatives" }, ip: { patents: 0, papers: 1, startups: 1, tech: 1 } },
        { stage: "Completed", uni: "u5", partner: "p1", budget: 480000, impact: { people: 2600, villages: 4, savings: 620000, jobs: 8, env: "2 km solar street lighting, 14 t CO2e avoided/yr" }, ip: { patents: 0, papers: 1, startups: 0, tech: 1 } },
      ];
      seedRefs.forEach((ch, i) => {
        const cfg = configs[i];
        const team = STUDENTS.filter((s) => s.uni === cfg.uni).slice(0, 4).map((s) => ({ name: s.name, dept: s.dept, role: "Team member" }));
        built.push(seedProject(ch, cfg.uni, {
          stage: cfg.stage, partner: cfg.partner, budget: cfg.budget,
          faculty: FACULTY.find((f) => f.uni === cfg.uni)?.name,
          team, impact: cfg.impact, ip: cfg.ip,
          milestones: [
            { name: "Field survey complete", due: "Week 3", done: true },
            { name: "Prototype v1 built", due: "Week 8", done: STAGES.indexOf(cfg.stage) >= 3 },
            { name: "Pilot approved", due: "Week 14", done: STAGES.indexOf(cfg.stage) >= 5 },
          ],
        }));
      });
      return built;
    };

export default function Samadhan() {
  const [role, setRole] = useState(null);
  const [view, setView] = useState("home");
  const [challenges, setChallenges] = useState(() => SEED_CHALLENGES.map(buildSeedChallenge));
  const [projects, setProjects] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [openProject, setOpenProject] = useState(null);
  const [demoDone, setDemoDone] = useState(new Set());
  const [guideOpen, setGuideOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const tick = useCallback((i) => setDemoDone((d) => (d.has(i) ? d : new Set(d).add(i))), []);
  const notify = useCallback((text, tone = "indigo") => {
    const n = { id: Math.random(), text, tone, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setNotifs((x) => [n, ...x].slice(0, 30));
    setToasts((x) => [...x, n]);
    setTimeout(() => setToasts((x) => x.filter((t) => t.id !== n.id)), 3800);
  }, []);

  // Restore saved progress if present, otherwise seed historical projects so
  // the analytics dashboard is not empty on first load.
  useEffect(() => {
    let dead = false;
    const seed = () => setChallenges((cs) => {
      const built = buildSeedProjects(cs);
      setProjects(built);
      return cs.map((c) => {
        const p = built.find((b) => b.challengeId === c.id);
        return p ? { ...c, status: p.stage === "Completed" ? "Completed" : "In Progress", projectId: p.id, assignedUni: p.uni } : c;
      });
    });

    (async () => {
      try {
        const saved = await window.storage.get(STORE_KEY);
        const s = saved?.value ? JSON.parse(saved.value) : null;
        if (!dead && s?.challenges?.length) {
          setChallenges(s.challenges);
          setProjects(s.projects || []);
          setHydrated(true);
          return;
        }
      } catch { /* nothing saved yet */ }
      if (dead) return;
      seed();
      setHydrated(true);
    })();
    return () => { dead = true; };
  }, []);

  // Persist after every change, so a reload keeps the demo where it was.
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try { window.storage.set(STORE_KEY, JSON.stringify({ challenges, projects })); } catch { /* storage unavailable */ }
    }, 500);
    return () => clearTimeout(t);
  }, [hydrated, challenges, projects]);

  const resetDemo = useCallback(async () => {
    try { await window.storage.delete(STORE_KEY); } catch { /* nothing to clear */ }
    const fresh = SEED_CHALLENGES.map(buildSeedChallenge);
    const built = buildSeedProjects(fresh);
    setProjects(built);
    setChallenges(fresh.map((c) => {
      const p = built.find((b) => b.challengeId === c.id);
      return p ? { ...c, status: p.stage === "Completed" ? "Completed" : "In Progress", projectId: p.id, assignedUni: p.uni } : c;
    }));
    setNotifs([]);
    setDemoDone(new Set());
    notify("Demo data reset to its starting state.", "slate");
  }, [notify]);

  const projectFor = (cid) => projects.find((p) => p.challengeId === cid);
  const updateProject = (id, patch) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) } : p)));
  const updateChallenge = (id, patch) => setChallenges((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const go = (v, opts = {}) => { setView(v); if (opts.id !== undefined) setOpenId(opts.id); if (opts.pid !== undefined) setOpenProject(opts.pid); window.scrollTo(0, 0); };

  const ctx = { role, challenges, projects, projectFor, updateProject, updateChallenge, setChallenges, setProjects, notify, tick, go, openId, openProject };

  if (!role) return <SignIn onPick={(r) => { setRole(r); tick(0); setView(r.id === "citizen" ? "home" : r.id === "admin" ? "admin" : r.id === "industry" ? "market" : "university"); }} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" style={{ fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif" }}>
      <TopNav role={role} setRole={setRole} view={view} go={go} notifs={notifs} bellOpen={bellOpen} setBellOpen={setBellOpen} resetDemo={resetDemo} />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6">
        {view === "home" && <Landing go={go} challenges={challenges} projects={projects} />}
        {view === "submit" && <SubmitChallenge {...ctx} />}
        {view === "discover" && <Discover {...ctx} />}
        {view === "challenge" && <ChallengeDetail {...ctx} />}
        {view === "admin" && <AdminQueue {...ctx} />}
        {view === "university" && <UniversityDash {...ctx} />}
        {view === "project" && <ProjectWorkspace {...ctx} />}
        {view === "market" && <IndustryMarket {...ctx} />}
        {view === "analytics" && <Analytics {...ctx} />}
      </main>
      <DemoGuide done={demoDone} open={guideOpen} setOpen={setGuideOpen} />
      <div className="fixed bottom-4 left-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex max-w-sm items-start gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm text-white shadow-lg">
            <Check size={15} className="mt-0.5 shrink-0 text-emerald-400" />{t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- sign in -------------------------------- */

function SignIn({ onPick }) {
  const [stage, setStage] = useState("pick");
  const [chosen, setChosen] = useState(null);
  const [otp, setOtp] = useState("");
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Layers size={22} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Samadhan</h1>
          <p className="mt-1.5 text-sm text-slate-600">Report a problem. Find the right minds. Build the solution.</p>
        </div>
        <Card className="p-6">
          {stage === "pick" ? (
            <>
              <p className="mb-3 text-sm font-medium text-slate-700">Continue as</p>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button key={r.id} onClick={() => { setChosen(r); setStage("otp"); }}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40">
                    <span className="rounded-lg bg-slate-100 p-2 text-slate-600"><r.icon size={16} /></span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-900">{r.label}</span>
                      <span className="block text-xs text-slate-500">{r.org}</span>
                    </span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Prototype sign-in. Real deployment uses email plus OTP with organisation verification for institutional roles.
              </p>
            </>
          ) : (
            <>
              <button onClick={() => setStage("pick")} className="mb-3 text-xs text-slate-500 hover:text-slate-800">Back</button>
              <p className="text-sm font-medium text-slate-900">Verify {chosen.label}</p>
              <p className="mb-4 text-xs text-slate-500">A 6-digit code was sent to the registered number ending 4417.</p>
              <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" className={cx(inputCls, "text-center text-lg tracking-widest")} />
              <Btn className="mt-4 w-full justify-center" onClick={() => onPick(chosen)}>
                <LogIn size={15} /> Verify and continue
              </Btn>
              <button onClick={() => setOtp("482913")} className="mt-2 w-full text-xs text-indigo-600 hover:underline">Autofill demo code</button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------- nav ----------------------------------- */

function TopNav({ role, setRole, view, go, notifs, bellOpen, setBellOpen, resetDemo }) {
  const links = [
    { id: "home", label: "Home", icon: Home, roles: ["citizen", "admin", "faculty", "student", "industry"] },
    { id: "submit", label: "Report a challenge", icon: Send, roles: ["citizen", "admin"] },
    { id: "discover", label: "Challenges", icon: Search, roles: ["citizen", "admin", "faculty", "student", "industry"] },
    { id: "admin", label: "Validation queue", icon: ShieldCheck, roles: ["admin"] },
    { id: "university", label: "University", icon: GraduationCap, roles: ["faculty", "student"] },
    { id: "market", label: "Partnerships", icon: Handshake, roles: ["industry", "faculty"] },
    { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["citizen", "admin", "faculty", "student", "industry"] },
  ].filter((l) => l.roles.includes(role.id));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
        <button onClick={() => go("home")} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"><Layers size={16} /></span>
          <span className="text-base font-semibold tracking-tight">Samadhan</span>
        </button>
        <nav className="hidden flex-1 items-center gap-0.5 md:flex">
          {links.map((l) => (
            <button key={l.id} onClick={() => go(l.id)}
              className={cx("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition",
                view === l.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-100")}>
              <l.icon size={14} />{l.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setBellOpen(!bellOpen)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Bell size={17} />
              {notifs.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />}
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2 text-sm font-medium">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-slate-500">Nothing yet. Activity on your challenges and projects appears here.</p>
                  ) : notifs.map((n) => (
                    <div key={n.id} className="flex gap-2 border-b border-slate-50 px-3 py-2.5 text-xs text-slate-700">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span className="flex-1">{n.text}</span>
                      <span className="shrink-0 text-slate-400">{n.at}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={resetDemo} title="Reset all demo data"
            className="hidden rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 sm:block">
            Reset demo
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 py-1 pl-2 pr-1">
            <role.icon size={14} className="text-slate-500" />
            <select value={role.id} onChange={(e) => setRole(ROLES.find((r) => r.id === e.target.value))}
              className="bg-transparent text-sm text-slate-700 focus:outline-none">
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------- landing -------------------------------- */

const FLOW = [
  ["Report", "Citizen or local body describes the problem", MapPin],
  ["Triage", "AI categorises, scores and de-duplicates", Sparkles],
  ["Validate", "District cell approves and prioritises", ShieldCheck],
  ["Match", "Universities matched on real expertise", GraduationCap],
  ["Build", "Multidisciplinary team plus industry partner", Users],
  ["Pilot", "Field testing in the affected district", Beaker],
  ["Impact", "Measured outcomes, IP and technology transfer", Award],
];

function Landing({ go, challenges, projects }) {
  const counts = useMemo(() => {
    const m = {}; challenges.forEach((c) => (m[c.region] = (m[c.region] || 0) + 1)); return m;
  }, [challenges]);
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm text-indigo-200">Societal Innovation Collaboration Portal</p>
            <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Report a problem. Find the right minds. Build the solution. Create measurable impact.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-indigo-100">
              Samadhan routes real problems from citizens and local bodies to the universities, industries and CSR partners
              equipped to solve them, then tracks the work all the way to a measured field outcome.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Btn size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50" onClick={() => go("submit")}>
                <Send size={16} /> Report a societal challenge
              </Btn>
              <Btn size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={() => go("discover")}>
                <Search size={16} /> Explore challenges
              </Btn>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Challenges logged", challenges.length],
              ["Active projects", projects.filter((p) => p.stage !== "Completed").length],
              ["Universities", UNIVERSITIES.length],
              ["Partners", PARTNERS.length],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-2xl font-semibold">{v}</p>
                <p className="text-xs text-indigo-100">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">How a problem becomes an outcome</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {FLOW.map(([t, d, Icon], i) => (
            <div key={t} className="relative rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon size={14} /></span>
                <span className="text-sm font-semibold">{t}</span>
              </div>
              <p className="text-xs leading-snug text-slate-600">{d}</p>
              {i < FLOW.length - 1 && <ChevronRight size={14} className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block" />}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Where challenges are coming from</h3>
          <IndiaMap counts={counts} height={340} />
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recently validated</h3>
            <button onClick={() => go("discover")} className="text-xs font-medium text-indigo-600 hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {challenges.slice(0, 5).map((c) => (
              <button key={c.id} onClick={() => go("challenge", { id: c.id })}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{c.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={11} />{c.district}
                    <span>·</span>{c.sector}
                    <span>·</span>{c.affected.toLocaleString("en-IN")} affected
                  </p>
                </div>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

/* ----------------------------- submit challenge --------------------------- */

function SubmitChallenge({ challenges, setChallenges, notify, tick, go }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [f, setF] = useState({
    title: "", description: "", sector: "auto", subSector: "", region: "", district: "",
    affected: "", severity: 4, urgency: 4, expectedOutcome: "", priorAttempts: "",
    evidence: [], sdgs: [],
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const fillDemo = () => {
    setF({
      title: "Village handpumps dry for four months a year",
      description: "Seven hamlets in the block rely on three handpumps that stop yielding from February to May. Groundwater has fallen below 220 metres. Families walk 2.5 km to a canal outlet, and the water is not treated. Tanker supply arrives twice a week and is not enough for livestock.",
      sector: "auto", subSector: "Drinking water supply", region: "GJ", district: "Banaskantha",
      affected: "6200", severity: 5, urgency: 5,
      expectedOutcome: "A community-managed supply that holds through the dry season without tankers.",
      priorAttempts: "Two deepening attempts in 2023 failed within a season.",
      evidence: [{ type: "image", name: "handpump-feb.jpg" }, { type: "image", name: "walk-route.jpg" }, { type: "audio", name: "sarpanch-statement.m4a" }],
      sdgs: [6, 11],
    });
    notify("Demo submission loaded");
  };

  const run = async () => {
    setBusy(true); setStep(4); tick(1); tick(2);
    const a = await assess({ ...f, affected: Number(f.affected) || 0 }, challenges);
    setResult(a); setBusy(false);
    tick(3); if (a.sector === "Water") tick(4);
    tick(5); if (a.duplicates?.length) tick(6); if (a.universities?.length >= 3) tick(7);
    notify(`AI assessment complete: ${a.sector}, priority ${a.priority}`);
  };

  const commit = () => {
    const c = {
      id: nextId(), ...f, affected: Number(f.affected) || 0, sector: result.sector,
      status: "Under Validation", submittedBy: "Citizen", submittedAt: new Date().toISOString().slice(0, 10),
      ai: result, projectId: null, assignedUni: null,
      sdgs: f.sdgs.length ? f.sdgs : result.sdgs,
    };
    setChallenges((cs) => [c, ...cs]);
    notify("Challenge submitted. It is now in the district validation queue.");
    go("challenge", { id: c.id });
  };

  const canNext = step === 1 ? f.title.length > 8 && f.description.length > 30 : step === 2 ? f.region && f.district : true;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Report a societal challenge</h1>
          <p className="mt-1 text-sm text-slate-600">Describe the problem in plain language. The triage engine handles categorisation.</p>
        </div>
        <Btn variant="outline" size="sm" onClick={fillDemo}><Sparkles size={13} /> Load demo case</Btn>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {["Describe", "Locate and evidence", "Review", "AI assessment"].map((s, i) => (
          <React.Fragment key={s}>
            <div className={cx("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
              step === i + 1 ? "bg-indigo-600 text-white" : step > i + 1 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
              {step > i + 1 ? <Check size={12} /> : <span>{i + 1}</span>}{s}
            </div>
            {i < 3 && <div className="h-px flex-1 bg-slate-200" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <Card className="space-y-4 p-5">
          <Field label="What is the problem?" hint="One sentence a neighbour would recognise.">
            <input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Village handpumps dry for four months a year" />
          </Field>
          <Field label="Describe it in detail" hint="Who is affected, since when, and what happens now.">
            <textarea rows={5} className={inputCls} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sector" hint="Leave on automatic to let the engine decide.">
              <select className={inputCls} value={f.sector} onChange={(e) => set("sector", e.target.value)}>
                <option value="auto">Detect automatically</option>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Sub-category"><input className={inputCls} value={f.subSector} onChange={(e) => set("subSector", e.target.value)} placeholder="Drinking water supply" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="People affected"><input type="number" className={inputCls} value={f.affected} onChange={(e) => set("affected", e.target.value)} placeholder="6200" /></Field>
            <Field label={`Severity: ${f.severity}/5`}>
              <input type="range" min="1" max="5" value={f.severity} onChange={(e) => set("severity", Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
            </Field>
            <Field label={`Urgency: ${f.urgency}/5`}>
              <input type="range" min="1" max="5" value={f.urgency} onChange={(e) => set("urgency", Number(e.target.value))} className="mt-2 w-full accent-indigo-600" />
            </Field>
          </div>
          <Field label="What would a good outcome look like?"><input className={inputCls} value={f.expectedOutcome} onChange={(e) => set("expectedOutcome", e.target.value)} /></Field>
          <Field label="Anything tried before?"><input className={inputCls} value={f.priorAttempts} onChange={(e) => set("priorAttempts", e.target.value)} placeholder="Optional" /></Field>
        </Card>
      )}

      {step === 2 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Pin the location</h3>
            <p className="mb-2 text-xs text-slate-500">Tap a state, then choose the district.</p>
            <IndiaMap mode="pick" selected={f.region} onSelect={(r) => { set("region", r); set("district", ""); }} height={320} />
            {f.region && (
              <div className="mt-3 space-y-3">
                <Field label="District">
                  <select className={inputCls} value={f.district} onChange={(e) => set("district", e.target.value)}>
                    <option value="">Select a district</option>
                    {REGION_BY_ID[f.region].districts.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                {f.district && (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <MapPin size={11} className="mr-1 inline" />
                    {f.district}, {REGION_BY_ID[f.region].name} · approx {(20 + centroid(REGION_BY_ID[f.region].pts)[1] / 20).toFixed(4)}° N, {(68 + centroid(REGION_BY_ID[f.region].pts)[0] / 12).toFixed(4)}° E
                  </p>
                )}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Evidence</h3>
            <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
              <Upload size={20} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600">Photos, video, audio statements or documents</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[["image", "site-photo.jpg"], ["video", "walkthrough.mp4"], ["audio", "resident-statement.m4a"], ["doc", "panchayat-letter.pdf"]].map(([t, n]) => (
                  <Btn key={t} size="sm" variant="outline" onClick={() => { set("evidence", [...f.evidence, { type: t, name: n }]); notify(`${n} attached`); }}>
                    <Plus size={12} /> {t}
                  </Btn>
                ))}
              </div>
            </div>
            {f.evidence.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {f.evidence.map((e, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <FileText size={13} className="text-slate-400" /><span className="flex-1">{e.name}</span>
                    <button onClick={() => set("evidence", f.evidence.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600"><X size={12} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">SDG alignment (optional)</p>
              <div className="flex flex-wrap gap-1.5">
                {SDGS.map((s) => (
                  <button key={s.n} onClick={() => set("sdgs", f.sdgs.includes(s.n) ? f.sdgs.filter((x) => x !== s.n) : [...f.sdgs, s.n])}
                    className={cx("rounded-md px-2 py-1 text-xs ring-1 transition",
                      f.sdgs.includes(s.n) ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300")}>
                    {s.n} {s.t}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Review before submitting</h3>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              ["Title", f.title], ["Location", f.district ? `${f.district}, ${REGION_BY_ID[f.region].name}` : "Not set"],
              ["Sector", f.sector === "auto" ? "Automatic" : f.sector], ["People affected", Number(f.affected).toLocaleString("en-IN")],
              ["Severity", `${f.severity}/5`], ["Urgency", `${f.urgency}/5`],
              ["Evidence", `${f.evidence.length} file(s)`], ["SDGs", f.sdgs.join(", ") || "Automatic"],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="text-sm font-medium text-slate-900">{v || "—"}</dd></div>
            ))}
          </dl>
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Description</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{f.description}</p>
          </div>
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-4">
          {busy ? (
            <Card className="flex flex-col items-center gap-3 p-12">
              <Loader2 size={26} className="animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Analysing the submission</p>
              <p className="text-xs text-slate-500">Categorising, scoring, checking for duplicates and matching expertise.</p>
            </Card>
          ) : result ? (
            <>
              <AIAssessmentCard a={result} />
              <div className="flex justify-end gap-2">
                <Btn variant="outline" onClick={() => setStep(1)}>Edit submission</Btn>
                <Btn onClick={commit}><Send size={15} /> Submit for validation</Btn>
              </div>
            </>
          ) : null}
        </div>
      )}

      {step < 4 && (
        <div className="mt-4 flex justify-between">
          <Btn variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Btn>
          {step < 3
            ? <Btn disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={15} /></Btn>
            : <Btn onClick={run}><Sparkles size={15} /> Run AI assessment</Btn>}
        </div>
      )}
    </div>
  );
}

/* --------------------------- AI assessment card --------------------------- */

function AIAssessmentCard({ a, compact = false }) {
  if (!a) return null;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-indigo-900">AI challenge assessment</h3>
        </div>
        <Badge tone={a.source === "model" ? "green" : "slate"}>
          {a.source === "model" ? "Live model" : "Offline analyser"}
        </Badge>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-3">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500">Category</p>
            <p className="text-lg font-semibold">{a.sector}</p>
          </div>
          <ScoreBar label="Priority score" value={a.priority} />
          <ScoreBar label="Impact score" value={a.impact} tone="green" />
          <div>
            <p className="mb-1 text-xs text-slate-500">Urgency</p>
            <Badge tone={a.urgency === "Critical" ? "red" : a.urgency === "High" ? "amber" : "slate"}>{a.urgency}</Badge>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-slate-500">SDG alignment</p>
            <div className="flex flex-wrap gap-1">
              {(a.sdgs || []).map((n) => <Badge key={n} tone="blue">SDG {n}</Badge>)}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-slate-500">Required expertise</p>
            <div className="flex flex-wrap gap-1">
              {(a.expertise || []).map((e) => <Badge key={e}>{e}</Badge>)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Recommended universities, with reasoning</p>
            <div className="space-y-2">
              {(a.universities || []).map((u) => (
                <div key={u.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{u.name}</p>
                    <Badge tone="indigo">{u.score}% match</Badge>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {u.reasons.map((r, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-slate-600"><Check size={11} className="mt-0.5 shrink-0 text-emerald-500" />{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Possible industry partners</p>
              <div className="space-y-1.5">
                {(a.partners || []).length === 0 && <p className="text-xs text-slate-400">No strong match yet.</p>}
                {(a.partners || []).map((p) => (
                  <div key={p.id} className="rounded-lg bg-slate-50 p-2.5">
                    <p className="text-xs font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.reasons[0]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Similar challenges already logged</p>
              {(a.duplicates || []).length === 0 ? (
                <p className="text-xs text-slate-400">No overlap found. This looks like a new problem.</p>
              ) : (
                <div className="space-y-1.5">
                  {a.duplicates.map((d) => (
                    <div key={d.id} className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium leading-snug text-amber-900">{d.title}</p>
                        <Badge tone="amber">{d.score}%</Badge>
                      </div>
                      <p className="text-xs text-amber-700">{d.district}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {!compact && a.keywords?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">Extracted keywords</p>
              <div className="flex flex-wrap gap-1">{a.keywords.map((k) => <Badge key={k}>{k}</Badge>)}</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------- discover -------------------------------- */

function Discover({ challenges, go, projectFor }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState("");
  const [sdg, setSdg] = useState("");

  const list = challenges.filter((c) =>
    (!q || `${c.title} ${c.description} ${c.district}`.toLowerCase().includes(q.toLowerCase())) &&
    (!region || c.region === region) && (!sector || c.sector === sector) &&
    (!status || c.status === status) && (!sdg || (c.sdgs || []).includes(Number(sdg)))
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Challenge marketplace</h1>
        <p className="mt-1 text-sm text-slate-600">{list.length} of {challenges.length} challenges match your filters.</p>
      </div>
      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={cx(inputCls, "pl-8")} placeholder="Search challenges" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All states</option>{REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className={inputCls} value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">All sectors</option>{SECTORS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            {["Under Validation", "Validated", "In Progress", "Completed"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">SDG:</span>
          {SDGS.slice(0, 8).map((s) => (
            <button key={s.n} onClick={() => setSdg(String(s.n) === sdg ? "" : String(s.n))}
              className={cx("rounded-md px-2 py-0.5 text-xs ring-1", String(s.n) === sdg ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-200")}>
              {s.n}
            </button>
          ))}
          {(q || region || sector || status || sdg) && (
            <button onClick={() => { setQ(""); setRegion(""); setSector(""); setStatus(""); setSdg(""); }}
              className="ml-auto text-xs text-indigo-600 hover:underline">Clear filters</button>
          )}
        </div>
      </Card>

      {list.length === 0 ? (
        <Card className="p-12 text-center">
          <Search size={22} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">No challenges match these filters</p>
          <p className="mt-1 text-xs text-slate-500">Widen the search, or report the problem yourself.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const p = projectFor(c.id);
            return (
              <button key={c.id} onClick={() => go("challenge", { id: c.id })}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Badge tone="indigo">{c.sector}</Badge>
                  <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                </div>
                <p className="text-sm font-semibold leading-snug">{c.title}</p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{c.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={11} />{c.district}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{c.affected.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <ScoreBar label="Priority" value={c.ai?.priority || 0} />
                  <ScoreBar label="Impact" value={c.ai?.impact || 0} tone="green" />
                </div>
                {p && <p className="mt-2 text-xs font-medium text-indigo-600">Project stage: {p.stage}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- challenge detail ---------------------------- */

function ChallengeDetail({ challenges, openId, go, projectFor, role, updateChallenge, setProjects, notify, tick }) {
  const c = challenges.find((x) => x.id === openId);
  if (!c) return <p className="text-sm text-slate-500">Challenge not found.</p>;
  const p = projectFor(c.id);

  const validate = () => {
    updateChallenge(c.id, { status: "Validated" });
    notify("Challenge validated and released to matched universities"); tick(8);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => go("discover")} className="text-xs text-slate-500 hover:text-slate-900">Back to challenges</button>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone="indigo">{c.sector}</Badge>
              <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              {(c.sdgs || []).map((n) => <Badge key={n} tone="blue">SDG {n}</Badge>)}
            </div>
            <h1 className="text-xl font-semibold leading-snug tracking-tight">{c.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">{c.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={12} />{c.district}, {REGION_BY_ID[c.region]?.name}</span>
              <span className="flex items-center gap-1"><Users size={12} />{c.affected.toLocaleString("en-IN")} affected</span>
              <span className="flex items-center gap-1"><Clock size={12} />Reported {c.submittedAt}</span>
              <span className="flex items-center gap-1"><FileText size={12} />{(c.evidence || []).length} evidence file(s)</span>
            </div>
          </div>
          <div className="flex gap-2">
            {role.id === "admin" && c.status === "Under Validation" && (
              <>
                <Btn variant="danger" size="sm" onClick={() => { updateChallenge(c.id, { status: "Rejected" }); notify("Challenge rejected"); }}>Reject</Btn>
                <Btn size="sm" onClick={validate}><ShieldCheck size={14} /> Validate</Btn>
              </>
            )}
            {p && <Btn size="sm" onClick={() => go("project", { pid: p.id })}>Open project <ArrowRight size={14} /></Btn>}
          </div>
        </div>
        {c.expectedOutcome && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Expected outcome</p>
            <p className="text-sm text-slate-700">{c.expectedOutcome}</p>
          </div>
        )}
      </Card>

      <AIAssessmentCard a={c.ai} />

      {role.id === "faculty" && c.status === "Validated" && !p && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold">This challenge is open to your institution</h3>
          <p className="mt-1 text-xs text-slate-600">Accepting creates a project workspace and unlocks team formation.</p>
          <Btn className="mt-3" onClick={() => {
            const pr = seedProject(c, "u1", { faculty: "Dr. Anjali Mehta" });
            setProjects((ps) => [...ps, pr]);
            updateChallenge(c.id, { status: "Assigned", projectId: pr.id, assignedUni: "u1" });
            notify("IIT Gandhinagar accepted the challenge"); tick(9);
            go("project", { pid: pr.id });
          }}><GraduationCap size={15} /> Accept on behalf of IIT Gandhinagar</Btn>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------ admin queue ------------------------------- */

function AdminQueue({ challenges, updateChallenge, go, notify, tick }) {
  const pending = challenges.filter((c) => c.status === "Under Validation");
  const [merge, setMerge] = useState(null);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Validation queue</h1>
        <p className="mt-1 text-sm text-slate-600">Screened submissions awaiting human review.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Awaiting review" value={pending.length} icon={Clock} />
        <Stat label="Validated" value={challenges.filter((c) => c.status === "Validated").length} icon={ShieldCheck} tone="green" />
        <Stat label="In progress" value={challenges.filter((c) => c.status === "In Progress" || c.status === "Assigned").length} icon={Rocket} />
        <Stat label="Completed" value={challenges.filter((c) => c.status === "Completed").length} icon={Award} tone="green" />
      </div>

      {pending.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldCheck size={22} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">The queue is clear</p>
          <p className="mt-1 text-xs text-slate-500">New citizen submissions land here after AI screening. Report one to see it arrive.</p>
          <Btn className="mt-4" size="sm" onClick={() => go("submit")}><Send size={13} /> Report a challenge</Btn>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="indigo">{c.ai?.sector}</Badge>
                    <Badge tone={c.ai?.urgency === "Critical" ? "red" : "amber"}>{c.ai?.urgency} urgency</Badge>
                    <Badge>Priority {c.ai?.priority}</Badge>
                    {c.ai?.duplicates?.length > 0 && <Badge tone="amber"><AlertTriangle size={11} />{c.ai.duplicates.length} similar</Badge>}
                  </div>
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{c.description}</p>
                  <p className="mt-1.5 text-xs text-slate-500">{c.district}, {REGION_BY_ID[c.region]?.name} · {c.affected.toLocaleString("en-IN")} affected</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Btn size="sm" onClick={() => { updateChallenge(c.id, { status: "Validated" }); notify("Challenge validated and matched universities notified"); tick(8); }}>
                    <Check size={13} /> Approve
                  </Btn>
                  <Btn size="sm" variant="outline" onClick={() => go("challenge", { id: c.id })}>Review detail</Btn>
                  {c.ai?.duplicates?.length > 0 && (
                    <Btn size="sm" variant="outline" onClick={() => setMerge(merge === c.id ? null : c.id)}>
                      Merge duplicate <ChevronDown size={12} />
                    </Btn>
                  )}
                  <Btn size="sm" variant="danger" onClick={() => { updateChallenge(c.id, { status: "Rejected" }); notify("Challenge rejected"); }}>Reject</Btn>
                </div>
              </div>
              {merge === c.id && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-900">Merge into an existing challenge</p>
                  {c.ai.duplicates.map((d) => (
                    <div key={d.id} className="mt-2 flex items-center justify-between gap-2 rounded-md bg-white p-2">
                      <span className="text-xs">{d.title} <span className="text-slate-400">· {d.score}% overlap</span></span>
                      <Btn size="sm" variant="outline" onClick={() => { updateChallenge(c.id, { status: "Rejected" }); notify("Merged as a duplicate report"); setMerge(null); }}>Merge</Btn>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------- university dashboard ------------------------- */

function UniversityDash({ challenges, projects, go, setProjects, updateChallenge, notify, tick, role }) {
  const uni = UNIVERSITIES[0];
  const mine = projects.filter((p) => p.uni === uni.id);
  const open = challenges.filter((c) =>
    c.status === "Validated" && !c.projectId &&
    (c.ai?.universities || []).some((u) => u.id === uni.id)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{uni.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{uni.depts.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {uni.expertise.map((e) => <Badge key={e} tone="indigo">{e}</Badge>)}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Active projects" value={mine.filter((p) => p.stage !== "Completed").length} icon={Rocket} />
        <Stat label="Matched challenges" value={open.length} icon={Target} />
        <Stat label="Students engaged" value={mine.reduce((a, p) => a + p.team.length, 0)} icon={Users} />
        <Stat label="Patents filed" value={uni.patents} icon={Award} tone="green" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Challenges matched to your expertise</h2>
        {open.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            No open matches right now. Validated challenges matching your departments appear here automatically.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {open.map((c) => {
              const match = c.ai.universities.find((u) => u.id === uni.id);
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge tone="indigo">{c.sector}</Badge>
                      <p className="mt-1.5 text-sm font-semibold leading-snug">{c.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{c.district} · {c.affected.toLocaleString("en-IN")} affected</p>
                    </div>
                    <Badge tone="green">{match?.score}% match</Badge>
                  </div>
                  <ul className="mt-2 space-y-0.5">
                    {(match?.reasons || []).slice(0, 3).map((r, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-slate-600"><Check size={11} className="mt-0.5 shrink-0 text-emerald-500" />{r}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <Btn size="sm" onClick={() => {
                      const pr = seedProject(c, uni.id, { faculty: "Dr. Anjali Mehta" });
                      setProjects((ps) => [...ps, pr]);
                      updateChallenge(c.id, { status: "Assigned", projectId: pr.id, assignedUni: uni.id });
                      notify(`${uni.name} accepted "${c.title.slice(0, 40)}..."`); tick(9);
                      go("project", { pid: pr.id });
                    }}><Check size={13} /> Accept assignment</Btn>
                    <Btn size="sm" variant="outline" onClick={() => go("challenge", { id: c.id })}>View detail</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Your projects</h2>
        {mine.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">Accept a matched challenge to open your first project workspace.</Card>
        ) : (
          <div className="space-y-2">
            {mine.map((p) => (
              <button key={p.id} onClick={() => go("project", { pid: p.id })}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300">
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.team.length} members · {p.faculty || "No mentor yet"} · {p.partner ? PARTNERS.find((x) => x.id === p.partner)?.name : "No partner yet"}</p>
                </div>
                <Badge tone={p.stage === "Completed" ? "green" : "indigo"}>{p.stage}</Badge>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* --------------------------- project workspace ---------------------------- */

const KANBAN = ["Backlog", "In Progress", "Review", "Done"];

function ProjectWorkspace({ projects, challenges, openProject, updateProject, updateChallenge, notify, tick, go, role }) {
  const p = projects.find((x) => x.id === openProject) || projects[0];
  const [tab, setTab] = useState("overview");
  const [comment, setComment] = useState("");
  if (!p) return <Card className="p-10 text-center text-sm text-slate-500">No project open yet.</Card>;
  const c = challenges.find((x) => x.id === p.challengeId);
  const uni = UNIVERSITIES.find((u) => u.id === p.uni);
  const partner = PARTNERS.find((x) => x.id === p.partner);
  const stageIdx = STAGES.indexOf(p.stage);

  const advance = (to, msg, step) => {
    updateProject(p.id, { stage: to, log: [{ at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text: msg }, ...p.log] });
    if (c) updateChallenge(c.id, { status: to === "Completed" ? "Completed" : to === "Pilot" ? "Pilot Testing" : "In Progress" });
    notify(msg); if (step !== undefined) tick(step);
  };

  const tabs = [
    ["overview", "Overview", Target], ["team", "Team", Users], ["tasks", "Tasks", Layers],
    ["solution", "Solution", Lightbulb], ["testing", "Testing & pilot", Beaker],
    ["impact", "Impact & IP", Award], ["discussion", "Discussion", FileText],
  ];

  return (
    <div className="space-y-4">
      <button onClick={() => go(role.id === "industry" ? "market" : "university")} className="text-xs text-slate-500 hover:text-slate-900">Back</button>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone="indigo">{c?.sector}</Badge>
            <h1 className="mt-1.5 text-xl font-semibold tracking-tight">{p.title}</h1>
            <p className="mt-1 text-xs text-slate-500">{uni?.name} · {c?.district} · Budget ₹{(p.budget / 100000).toFixed(1)}L</p>
          </div>
          <Badge tone={p.stage === "Completed" ? "green" : "indigo"} className="text-sm">{p.stage}</Badge>
        </div>
        <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
          {STAGES.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cx("shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
                i < stageIdx ? "bg-emerald-50 text-emerald-700" : i === stageIdx ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400")}>
                {s}
              </div>
              {i < STAGES.length - 1 && <div className={cx("h-px w-3 shrink-0", i < stageIdx ? "bg-emerald-300" : "bg-slate-200")} />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cx("flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition",
              tab === id ? "border-indigo-600 font-medium text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800")}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold">Problem being solved</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{c?.description}</p>
            <h3 className="mt-5 text-sm font-semibold">Milestones</h3>
            <div className="mt-2 space-y-2">
              {p.milestones.map((m, i) => (
                <label key={i} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 p-2.5">
                  <input type="checkbox" checked={m.done} className="accent-indigo-600"
                    onChange={() => updateProject(p.id, (pr) => ({ milestones: pr.milestones.map((x, j) => j === i ? { ...x, done: !x.done } : x) }))} />
                  <span className={cx("flex-1 text-sm", m.done && "text-slate-400 line-through")}>{m.name}</span>
                  <span className="text-xs text-slate-400">{m.due}</span>
                </label>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Partners</h3>
              <div className="space-y-2 text-sm">
                <div><p className="text-xs text-slate-500">University</p><p>{uni?.name}</p></div>
                <div><p className="text-xs text-slate-500">Faculty mentor</p><p>{p.faculty || "Not assigned"}</p></div>
                <div><p className="text-xs text-slate-500">Industry partner</p><p>{partner ? `${partner.name} (${partner.type})` : "Open to partners"}</p></div>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Activity</h3>
              {p.log.length === 0 ? <p className="text-xs text-slate-500">Nothing logged yet.</p> : (
                <ul className="space-y-1.5">
                  {p.log.slice(0, 6).map((l, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600"><span className="text-slate-400">{l.at}</span>{l.text}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "team" && <TeamTab p={p} updateProject={updateProject} notify={notify} tick={tick} advance={advance} />}
      {tab === "tasks" && <TasksTab p={p} updateProject={updateProject} />}
      {tab === "solution" && <SolutionTab p={p} c={c} updateProject={updateProject} advance={advance} notify={notify} tick={tick} role={role} />}
      {tab === "testing" && <TestingTab p={p} c={c} updateProject={updateProject} advance={advance} notify={notify} tick={tick} />}
      {tab === "impact" && <ImpactTab p={p} c={c} updateProject={updateProject} advance={advance} notify={notify} tick={tick} />}
      {tab === "discussion" && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Project discussion</h3>
          <div className="space-y-2">
            {p.comments.length === 0 && <p className="text-xs text-slate-500">No messages yet. Start the conversation with your mentors and partner.</p>}
            {p.comments.map((m, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-900">{m.who} <span className="font-normal text-slate-400">{m.at}</span></p>
                <p className="mt-0.5 text-sm text-slate-700">{m.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a message to the team" />
            <Btn disabled={!comment.trim()} onClick={() => {
              updateProject(p.id, (pr) => ({ comments: [...pr.comments, { who: role.label, text: comment, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }] }));
              setComment(""); notify("Message posted to the project");
            }}><Send size={14} /> Post</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

function TeamTab({ p, updateProject, notify, tick, advance }) {
  const pool = STUDENTS.filter((s) => s.uni === p.uni && !p.team.some((t) => t.name === s.name));
  const facultyPool = FACULTY.filter((f) => f.uni === p.uni);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm font-semibold">Team</h3>
        <p className="mt-0.5 text-xs text-slate-500">Build across departments. A water project needs civil, computing and environmental perspectives together.</p>
        {!p.faculty && (
          <div className="mt-3">
            <Field label="Assign faculty mentor">
              <select className={inputCls} onChange={(e) => { updateProject(p.id, { faculty: e.target.value }); notify(`${e.target.value} added as faculty mentor`); }} defaultValue="">
                <option value="" disabled>Select faculty</option>
                {facultyPool.map((f) => <option key={f.id} value={f.name}>{f.name} · {f.field}</option>)}
              </select>
            </Field>
          </div>
        )}
        <div className="mt-3 space-y-2">
          {p.faculty && (
            <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">{p.faculty.split(" ")[1]?.[0] || "F"}</span>
              <div className="flex-1"><p className="text-sm font-medium">{p.faculty}</p><p className="text-xs text-slate-500">Faculty mentor</p></div>
            </div>
          )}
          {p.team.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">No students yet. Invite from the pool.</p>}
          {p.team.map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">{t.name[0]}</span>
              <div className="flex-1"><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-slate-500">{t.dept}</p></div>
              <button onClick={() => updateProject(p.id, (pr) => ({ team: pr.team.filter((_, j) => j !== i) }))} className="text-slate-400 hover:text-red-600"><X size={14} /></button>
            </div>
          ))}
        </div>
        {p.team.length >= 3 && p.stage === "Team Formation" && (
          <Btn className="mt-3 w-full justify-center" onClick={() => advance("Solution Proposal", "Multidisciplinary team formed and confirmed", 11)}>
            <Check size={15} /> Confirm team and move to proposal
          </Btn>
        )}
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-semibold">Available students</h3>
        <p className="mt-0.5 text-xs text-slate-500">Grouped by department so you can deliberately mix disciplines.</p>
        <div className="mt-3 max-h-96 space-y-1.5 overflow-y-auto">
          {pool.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
              <div className="flex-1"><p className="text-sm">{s.name}</p><p className="text-xs text-slate-500">{s.dept} · Year {s.year}</p></div>
              <Btn size="sm" variant="outline" onClick={() => {
                updateProject(p.id, (pr) => ({ team: [...pr.team, { name: s.name, dept: s.dept, role: "Team member" }] }));
                notify(`${s.name} joined the team`); tick(10); tick(11);
              }}><UserPlus size={12} /> Invite</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TasksTab({ p, updateProject }) {
  const [title, setTitle] = useState("");
  const move = (id, dir) => updateProject(p.id, (pr) => ({
    tasks: pr.tasks.map((t) => t.id === id ? { ...t, status: KANBAN[Math.max(0, Math.min(3, KANBAN.indexOf(t.status) + dir))] } : t),
  }));
  return (
    <div>
      <Card className="mb-3 flex gap-2 p-3">
        <input className={inputCls} placeholder="Add a task, e.g. Map borewell yield across 7 hamlets" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Btn disabled={!title.trim()} onClick={() => {
          updateProject(p.id, (pr) => ({ tasks: [...pr.tasks, { id: Math.random(), title, status: "Backlog", assignee: pr.team[0]?.name || "Unassigned" }] }));
          setTitle("");
        }}><Plus size={14} /> Add task</Btn>
      </Card>
      <div className="grid gap-3 md:grid-cols-4">
        {KANBAN.map((col) => (
          <div key={col} className="rounded-xl bg-slate-100/70 p-2.5">
            <p className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-slate-600">
              {col}<span className="rounded bg-white px-1.5 text-slate-500">{p.tasks.filter((t) => t.status === col).length}</span>
            </p>
            <div className="space-y-2">
              {p.tasks.filter((t) => t.status === col).map((t) => (
                <div key={t.id} className="rounded-lg bg-white p-2.5 shadow-sm">
                  <p className="text-xs leading-snug">{t.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{t.assignee}</span>
                    <span className="flex gap-1">
                      <button onClick={() => move(t.id, -1)} className="rounded px-1 text-slate-400 hover:bg-slate-100">←</button>
                      <button onClick={() => move(t.id, 1)} className="rounded px-1 text-slate-400 hover:bg-slate-100">→</button>
                    </span>
                  </div>
                </div>
              ))}
              {p.tasks.filter((t) => t.status === col).length === 0 && <p className="px-1 py-3 text-center text-xs text-slate-400">Empty</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SolutionTab({ p, c, updateProject, advance, notify, tick, role }) {
  const [s, setS] = useState(p.solution || { title: "", approach: "", tech: "", innovation: "", cost: "", timeline: "", scalability: "", risks: "" });
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const submitted = !!p.solution;

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone={p.stage === "Approval" || p.stage === "Solution Proposal" ? "amber" : "green"}>
                {p.stage === "Solution Proposal" ? "Under review" : "Approved"}
              </Badge>
              <h3 className="mt-1.5 text-lg font-semibold">{p.solution.title}</h3>
            </div>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[["Proposed approach", p.solution.approach], ["Technology used", p.solution.tech],
            ["What is new here", p.solution.innovation], ["Estimated cost", p.solution.cost],
            ["Timeline", p.solution.timeline], ["Scalability", p.solution.scalability],
            ["Key risks", p.solution.risks]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 text-sm text-slate-700">{v}</dd></div>
            ))}
          </dl>
        </Card>
        {p.stage === "Solution Proposal" && (
          <Card className="p-4">
            <p className="text-sm font-semibold">Reviewer decision</p>
            <p className="mt-0.5 text-xs text-slate-600">Government validator and industry mentor sign off before prototyping funds release.</p>
            <div className="mt-3 flex gap-2">
              <Btn onClick={() => advance("Prototype", "Solution proposal approved. Prototyping authorised.", 15)}><Check size={15} /> Approve proposal</Btn>
              <Btn variant="outline" onClick={() => notify("Revision requested and sent to the team")}>Request revision</Btn>
            </div>
          </Card>
        )}
        {p.stage === "Prototype" && (
          <Card className="p-4">
            <p className="text-sm font-semibold">Prototype</p>
            <p className="mt-0.5 text-xs text-slate-600">Log the build so testing can begin.</p>
            <Btn className="mt-3" onClick={() => advance("Testing", "Prototype v1 logged and handed to testing", 16)}>
              <FlaskConical size={15} /> Log prototype v1
            </Btn>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Submit a solution proposal</h3>
        <Btn size="sm" variant="outline" onClick={() => setS({
          title: "Solar-powered recharge shafts with community-read water level sensors",
          approach: "Site three recharge shafts on the natural drainage line, paired with low-cost pressure sensors reporting water level to a shared dashboard the panchayat reads weekly.",
          tech: "Solar submersible pump, percolation shaft, LoRaWAN pressure sensor, offline-first dashboard",
          innovation: "Recharge siting driven by measured yield data rather than uniform spacing, with the panchayat holding the maintenance contract.",
          cost: "₹18.5 lakh for seven hamlets", timeline: "22 weeks to pilot completion",
          scalability: "Design replicates across 40 similar blocks in north Gujarat with the same aquifer profile.",
          risks: "Sensor theft, monsoon failure in year one, unclear land title on two shaft sites.",
        })}><Sparkles size={12} /> Prefill demo proposal</Btn>
      </div>
      <Field label="Solution title"><input className={inputCls} value={s.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Proposed approach"><textarea rows={3} className={inputCls} value={s.approach} onChange={(e) => set("approach", e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Technology used"><input className={inputCls} value={s.tech} onChange={(e) => set("tech", e.target.value)} /></Field>
        <Field label="What is new here"><input className={inputCls} value={s.innovation} onChange={(e) => set("innovation", e.target.value)} /></Field>
        <Field label="Estimated cost"><input className={inputCls} value={s.cost} onChange={(e) => set("cost", e.target.value)} /></Field>
        <Field label="Implementation timeline"><input className={inputCls} value={s.timeline} onChange={(e) => set("timeline", e.target.value)} /></Field>
        <Field label="Scalability"><input className={inputCls} value={s.scalability} onChange={(e) => set("scalability", e.target.value)} /></Field>
        <Field label="Key risks"><input className={inputCls} value={s.risks} onChange={(e) => set("risks", e.target.value)} /></Field>
      </div>
      <Btn disabled={!s.title || !s.approach} onClick={() => {
        updateProject(p.id, { solution: s, stage: "Solution Proposal" });
        notify("Solution proposal submitted for review"); tick(14);
      }}><Send size={15} /> Submit proposal</Btn>
    </Card>
  );
}

function TestingTab({ p, c, updateProject, advance, notify, tick }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm font-semibold">Testing results</h3>
        {p.tests.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
            No test runs logged. Record a field test to move toward pilot approval.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {p.tests.map((t, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t.version} · {t.location}</p>
                  <Badge tone={t.success >= 80 ? "green" : "amber"}>{t.success}% success</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">{t.result}</p>
                <p className="mt-1 text-xs text-slate-500">Issues: {t.issues}</p>
              </div>
            ))}
          </div>
        )}
        <Btn className="mt-3" size="sm" variant="outline" disabled={STAGES.indexOf(p.stage) < 4} onClick={() => {
          updateProject(p.id, (pr) => ({
            tests: [...pr.tests, {
              version: `v1.${pr.tests.length}`, location: `${c?.district} block`, date: new Date().toISOString().slice(0, 10),
              success: 74 + pr.tests.length * 9,
              result: "Shaft recharge measurable after two rain events. Sensor uptime 96 percent over 30 days.",
              issues: "One sensor housing cracked; pump duty cycle needs tuning for low-voltage hours.",
            }],
          }));
          notify("Test results uploaded"); tick(17);
        }}><Plus size={13} /> Log a field test</Btn>
        {STAGES.indexOf(p.stage) < 4 && <p className="mt-1.5 text-xs text-slate-400">Available once a prototype exists.</p>}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold">Pilot implementation</h3>
        {p.pilot ? (
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {[["District", p.pilot.district], ["Community", p.pilot.community], ["Beneficiaries", p.pilot.beneficiaries.toLocaleString("en-IN")],
            ["Partner", p.pilot.partner], ["Start", p.pilot.start], ["Status", p.pilot.status]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="text-sm font-medium">{v}</dd></div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
            No pilot yet. Launch once test results clear the threshold.
          </p>
        )}
        <Btn className="mt-3" disabled={p.tests.length === 0 || !!p.pilot} onClick={() => {
          updateProject(p.id, {
            pilot: {
              district: c?.district, community: "7 hamlets, Dantiwada block", beneficiaries: c?.affected || 6200,
              partner: PARTNERS.find((x) => x.id === p.partner)?.name || "District administration",
              start: new Date().toISOString().slice(0, 10), status: "Running",
            },
          });
          advance("Pilot", "Pilot launched in the affected district", 18);
        }}><Rocket size={15} /> Launch pilot</Btn>
      </Card>
    </div>
  );
}

function ImpactTab({ p, c, updateProject, advance, notify, tick }) {
  const [m, setM] = useState(p.impact || { people: "", villages: "", savings: "", jobs: "", env: "" });
  const set = (k, v) => setM((x) => ({ ...x, [k]: v }));
  const recorded = !!p.impact;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold">Impact measurement</h3>
        {recorded ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Stat label="People benefited" value={Number(p.impact.people).toLocaleString("en-IN")} icon={Users} tone="green" />
              <Stat label="Communities" value={p.impact.villages} icon={Home} tone="green" />
              <Stat label="Annual savings" value={`₹${(Number(p.impact.savings) / 100000).toFixed(1)}L`} icon={TrendingUp} tone="green" />
              <Stat label="Jobs created" value={p.impact.jobs} icon={Rocket} tone="green" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-medium text-slate-500">Before</p>
                <p className="mt-1 text-sm text-slate-700">{c?.description.slice(0, 130)}...</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-xs font-medium text-emerald-700">After</p>
                <p className="mt-1 text-sm text-emerald-900">{p.impact.env}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="People benefited"><input type="number" className={inputCls} value={m.people} onChange={(e) => set("people", e.target.value)} /></Field>
              <Field label="Communities"><input type="number" className={inputCls} value={m.villages} onChange={(e) => set("villages", e.target.value)} /></Field>
              <Field label="Annual savings (₹)"><input type="number" className={inputCls} value={m.savings} onChange={(e) => set("savings", e.target.value)} /></Field>
              <Field label="Jobs created"><input type="number" className={inputCls} value={m.jobs} onChange={(e) => set("jobs", e.target.value)} /></Field>
            </div>
            <Field label="Environmental or service outcome"><input className={inputCls} value={m.env} onChange={(e) => set("env", e.target.value)} /></Field>
            <div className="flex gap-2">
              <Btn variant="outline" size="sm" onClick={() => setM({ people: String(c?.affected || 6200), villages: "7", savings: "2900000", jobs: "24", env: "Tanker dependence eliminated for the dry season; measured water table recovery of 4.2 m after two monsoons." })}>
                <Sparkles size={12} /> Prefill from pilot data
              </Btn>
              <Btn disabled={!m.people || !m.env} onClick={() => {
                updateProject(p.id, { impact: m });
                notify("Impact metrics recorded"); tick(19);
              }}><Check size={15} /> Record impact</Btn>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold">Innovation outcomes</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {[["Patents filed", "patents"], ["Research papers", "papers"], ["Startups created", "startups"], ["Technologies transferred", "tech"]].map(([label, key]) => (
            <div key={key} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xl font-semibold">{p.ip[key]}</p>
                <button onClick={() => updateProject(p.id, (pr) => ({ ip: { ...pr.ip, [key]: pr.ip[key] + 1 } }))}
                  className="rounded border border-slate-200 px-1.5 text-xs text-slate-500 hover:bg-slate-50">+</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {recorded && p.stage !== "Completed" && (
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold">Close the project</p>
            <p className="text-xs text-slate-600">Marks the challenge implemented and publishes outcomes to the analytics dashboard.</p>
          </div>
          <Btn variant="success" onClick={() => { advance("Completed", "Project marked implemented and closed", 20); tick(21); }}>
            <Award size={15} /> Mark implemented
          </Btn>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------- industry market ----------------------------- */

function IndustryMarket({ projects, challenges, updateProject, notify, tick, go }) {
  const me = PARTNERS[1];
  const open = projects.filter((p) => !p.partner && p.stage !== "Completed");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Partnership marketplace</h1>
        <p className="mt-1 text-sm text-slate-600">You are viewing as {me.name} ({me.type}).</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Open to partners" value={open.length} icon={Handshake} />
        <Stat label="Your collaborations" value={projects.filter((p) => p.partner === me.id).length} icon={Factory} />
        <Stat label="Universities on platform" value={UNIVERSITIES.length} icon={GraduationCap} />
        <Stat label="Challenges live" value={challenges.length} icon={Target} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Projects seeking a partner</h2>
        {open.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">No unpartnered projects right now.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {open.map((p) => {
              const c = challenges.find((x) => x.id === p.challengeId);
              const uni = UNIVERSITIES.find((u) => u.id === p.uni);
              return (
                <Card key={p.id} className="p-4">
                  <Badge tone="indigo">{c?.sector}</Badge>
                  <p className="mt-1.5 text-sm font-semibold leading-snug">{p.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{uni?.name} · {c?.district} · {p.team.length} students · stage {p.stage}</p>
                  <p className="mt-2 text-xs text-slate-600">Fit: your {me.expertise[0]} capability maps to the required expertise on this challenge.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn size="sm" onClick={() => {
                      updateProject(p.id, { partner: me.id, budget: p.budget + 1200000 });
                      notify(`${me.name} joined as industry partner with ₹12L support`); tick(12); tick(13);
                    }}><Handshake size={13} /> Offer mentorship and funding</Btn>
                    <Btn size="sm" variant="outline" onClick={() => go("project", { pid: p.id })}>Open project</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Partner directory</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PARTNERS.map((p) => (
            <Card key={p.id} className="p-4">
              <Badge>{p.type}</Badge>
              <p className="mt-1.5 text-sm font-semibold">{p.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{p.sector}</p>
              <p className="mt-2 text-xs text-slate-600">{p.expertise.join(", ")}</p>
              <p className="mt-2 text-xs font-medium text-indigo-600">Typical support: {p.funding}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------- analytics ------------------------------- */

const PIE_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"];

function Analytics({ challenges, projects, go }) {
  const [drill, setDrill] = useState(null);

  const counts = useMemo(() => {
    const m = {}; challenges.forEach((c) => (m[c.region] = (m[c.region] || 0) + 1)); return m;
  }, [challenges]);

  const bySector = useMemo(() => {
    const m = {}; challenges.forEach((c) => (m[c.sector] = (m[c.sector] || 0) + 1));
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [challenges]);

  const byDistrict = useMemo(() => {
    const src = drill ? challenges.filter((c) => c.region === drill) : challenges;
    const m = {}; src.forEach((c) => (m[c.district] = (m[c.district] || 0) + 1));
    return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [challenges, drill]);

  const overTime = useMemo(() => {
    const m = {};
    challenges.forEach((c) => {
      const k = (c.submittedAt || "").slice(0, 7);
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort().map(([month, count]) => ({ month, count }));
  }, [challenges]);

  const completed = projects.filter((p) => p.stage === "Completed");
  const impacted = completed.reduce((a, p) => a + Number(p.impact?.people || 0), 0);
  const ip = projects.reduce((a, p) => ({
    patents: a.patents + p.ip.patents, papers: a.papers + p.ip.papers,
    startups: a.startups + p.ip.startups, tech: a.tech + p.ip.tech,
  }), { patents: 0, papers: 0, startups: 0, tech: 0 });

  const funnel = [
    ["Reported", challenges.length],
    ["Validated", challenges.filter((c) => !["Under Validation", "Draft", "Rejected"].includes(c.status)).length],
    ["Assigned", projects.length],
    ["In pilot or beyond", projects.filter((p) => STAGES.indexOf(p.stage) >= 5).length],
    ["Completed", completed.length],
  ];

  const stageDist = STAGES.map((s) => ({ name: s, count: projects.filter((p) => p.stage === s).length })).filter((x) => x.count);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Live across every challenge, project and measured outcome.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Challenges" value={challenges.length} icon={Target} />
        <Stat label="Active projects" value={projects.filter((p) => p.stage !== "Completed").length} icon={Rocket} />
        <Stat label="Completed" value={completed.length} icon={Award} tone="green" />
        <Stat label="Students involved" value={projects.reduce((a, p) => a + p.team.length, 0)} icon={Users} />
        <Stat label="People impacted" value={impacted.toLocaleString("en-IN")} icon={TrendingUp} tone="green" />
        <Stat label="Patents filed" value={ip.patents} icon={Award} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Challenges by state</h3>
            {drill && <button onClick={() => setDrill(null)} className="text-xs text-indigo-600 hover:underline">Clear drill-down</button>}
          </div>
          <p className="text-xs text-slate-500">{drill ? `Showing ${REGION_BY_ID[drill].name}. Tap again to change.` : "Tap a state to drill into its districts."}</p>
          <IndiaMap counts={counts} height={330} onSelect={setDrill} />
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {drill ? `Districts in ${REGION_BY_ID[drill].name}` : "Top districts nationally"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byDistrict} layout="vertical" margin={{ left: 12, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Challenges by sector</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bySector} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {bySector.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Reports over time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Where projects sit</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stageDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Problem to impact conversion</h3>
        <div className="flex flex-wrap items-stretch gap-2">
          {funnel.map(([label, n], i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-2xl font-semibold text-indigo-700">{n}</p>
                <p className="text-xs text-slate-500">{label}</p>
                {i > 0 && <p className="mt-0.5 text-xs text-slate-400">{funnel[i - 1][1] ? Math.round((n / funnel[i - 1][1]) * 100) : 0}% of previous</p>}
              </div>
              {i < funnel.length - 1 && <ChevronRight size={16} className="shrink-0 text-slate-300" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Innovation outcomes</h3>
          <div className="grid grid-cols-4 gap-3">
            {[["Patents", ip.patents], ["Papers", ip.papers], ["Startups", ip.startups], ["Technologies", ip.tech]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xl font-semibold">{v}</p><p className="text-xs text-slate-500">{k}</p>
              </div>
            ))}
          </div>
          <h3 className="mb-2 mt-5 text-sm font-semibold">SDG contribution</h3>
          <div className="flex flex-wrap gap-1.5">
            {SDGS.map((s) => {
              const n = challenges.filter((c) => (c.sdgs || []).includes(s.n)).length;
              return n ? <Badge key={s.n} tone="blue">SDG {s.n} · {n}</Badge> : null;
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Community impact from completed work</h3>
          {completed.length === 0 ? (
            <p className="text-xs text-slate-500">No completed projects yet.</p>
          ) : (
            <div className="space-y-2">
              {completed.map((p) => {
                const c = challenges.find((x) => x.id === p.challengeId);
                return (
                  <button key={p.id} onClick={() => go("project", { pid: p.id })}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left hover:border-indigo-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">{c?.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{p.impact?.env}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">{Number(p.impact?.people || 0).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-slate-500">benefited</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
