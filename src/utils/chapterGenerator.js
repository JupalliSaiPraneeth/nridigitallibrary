/**
 * Academic Chapter & Content Generator for Digital E-Book Reader
 * Generates structured, rich HTML chapters with diagrams, formulas, and syllabus topics
 */

export function generateRichChapters(bookTitle = "Academic Textbook", department = "CSE") {
  const deptUpper = (department || "CSE").toUpperCase();

  const syllabusMap = {
    CSE: [
      {
        title: "Chapter 1: Foundational Architecture & Mathematical Logic",
        topics: ["Boolean Algebra & Gate Synthesis", "Computational Complexity & O(N) Analysis", "Memory Hierarchy & Virtual Addressing", "Instruction Set Architecture (ISA)"]
      },
      {
        title: "Chapter 2: Data Structures & Algorithmic Paradigm",
        topics: ["Balanced Search Trees (AVL & Red-Black)", "Graph Traversal & Shortest Path (Dijkstra)", "Dynamic Programming & Matrix Multiplication", "Hash Collision Resolution & Universal Hashing"]
      },
      {
        title: "Chapter 3: Deep Neural Networks & Transformer Models",
        topics: ["Backpropagation & Gradient Descent", "Convolutional Layer Filters & Pooling", "Self-Attention Mechanism & QKV Matrices", "Model Optimization & Quantization"]
      },
      {
        title: "Chapter 4: Distributed Systems & Microservice Security",
        topics: ["CAP Theorem & Consensus (Raft/Paxos)", "REST vs gRPC Communication Protocols", "OAuth2 & JWT Security Token Exchange", "Containerization & Kubernetes Orchestration"]
      },
      {
        title: "Chapter 5: Advanced Database Systems & Concurrency",
        topics: ["ACID Properties & Multi-Version Concurrency (MVCC)", "B+ Tree Indexing & Query Optimization", "NoSQL Document Stores & Sharding Keys", "Distributed Transaction Two-Phase Commit"]
      }
    ],
    ECE: [
      {
        title: "Chapter 1: Semiconductor Physics & MOSFET Microarchitecture",
        topics: ["Pn Junction Diode Dynamics & Carrier Drift", "MOSFET I-V Characteristics & Sub-threshold Leakage", "CMOS Inverter Transfer Characteristics & Noise Margins", "FinFET 3D Transistor Scaling"]
      },
      {
        title: "Chapter 2: Signal Processing & Spectral Analysis",
        topics: ["Continuous & Discrete Fourier Transforms (DFT/FFT)", "Z-Transform & Pole-Zero Filter Stability", "Finite Impulse Response (FIR) Filter Design", "Sampling Theorem & Aliasing Mitigation"]
      },
      {
        title: "Chapter 3: VLSI Circuit Design & Synthesizable Verilog",
        topics: ["Combinational Logic Synthesis & Karnaugh Maps", "Sequential Flip-Flop Setup & Hold Time Constraints", "Verilog HDL Finite State Machine (FSM) Modeling", "Static Timing Analysis (STA) & Clock Skew"]
      },
      {
        title: "Chapter 4: RF & Electromagnetic Wave Propagation",
        topics: ["Maxwell's Equations & Boundary Conditions", "Transmission Line Impedance Matching & Smith Chart", "Antenna Gain, Directivity & Radiation Patterns", "Wireless Channel Fading & MIMO Diversity"]
      }
    ],
    EEE: [
      {
        title: "Chapter 1: AC & DC Electric Machinery Principles",
        topics: ["Electromagnetic Induction & Faraday's Law", "Three-Phase Synchronous Generator Characteristics", "DC Motor Speed Control & Armature Reaction", "Transformer Equivalent Circuit & Efficiency"]
      },
      {
        title: "Chapter 2: Power Electronics & Semiconductor Switching",
        topics: ["Thyristor, IGBT & SiC MOSFET Devices", "Buck, Boost & Buck-Boost DC-DC Converters", "Pulse Width Modulation (PWM) Inverter Topologies", "Harmonic Distortion & Active Power Filtering"]
      },
      {
        title: "Chapter 3: Power System Analysis & Load Flow Dynamics",
        topics: ["Per-Unit System & Single-Line Diagrams", "Gauss-Seidel & Newton-Raphson Load Flow", "Symmetrical Components & Fault Analysis", "Transient Stability & Swing Equation"]
      }
    ],
    MECH: [
      {
        title: "Chapter 1: Applied Thermodynamics & Thermal Engineering",
        topics: ["First & Second Laws of Thermodynamics", "Carnot, Rankine & Otto Thermodynamic Cycles", "Heat Transfer: Conduction, Convection & Radiation", "Refrigeration Cycles & Psychrometric Charts"]
      },
      {
        title: "Chapter 2: Solid Mechanics & Finite Element Analysis",
        topics: ["Stress-Strain Relations & Hooke's Law", "Shear Force & Bending Moment Diagrams", "Torsional Stresses in Circular Shafts", "FEA Discretization & Stiffness Matrix Synthesis"]
      },
      {
        title: "Chapter 3: Kinematics of Machinery & Fluid Dynamics",
        topics: ["Four-Bar Mechanism & Cam Profile Synthesis", "Navier-Stokes Equations & Boundary Layer Theory", "Bernoulli Equation & Venturi Flow Measurement", "Hydraulic Turbines (Pelton, Francis, Kaplan)"]
      }
    ],
    CIVIL: [
      {
        title: "Chapter 1: Advanced Structural Analysis & Reinforced Concrete",
        topics: ["Flexural Design of RC Beams (IS 456:2000)", "Column Design & Limit State Method", "Prestressed Concrete Girders & Losses", "Moment Distribution & Slope Deflection Methods"]
      },
      {
        title: "Chapter 2: Geotechnical Engineering & Soil Mechanics",
        topics: ["Soil Classification & Atterberg Limits", "Effective Stress Principle & Permeability", "Bearing Capacity of Shallow & Deep Foundation", "Slope Stability & Earth Pressure Theories"]
      }
    ],
    PHARM: [
      {
        title: "Chapter 1: Medicinal Chemistry & Receptor Pharmacodynamics",
        topics: ["Structure-Activity Relationship (SAR) Studies", "Enzyme Inhibition & Allosteric Modulation", "G-Protein Coupled Receptor (GPCR) Signaling", "Drug Metabolism & Cytochrome P450 Enzymes"]
      },
      {
        title: "Chapter 2: Novel Drug Delivery Systems & Biopharmaceutics",
        topics: ["Liposomal & Nanoparticle Formulations", "Controlled Release Matrix Tablets & Dissolution", "Bioavailability & Bioequivalence Protocols", "GMP Compliance & USFDA Regulatory Standards"]
      }
    ]
  };

  const selectedSyllabus = syllabusMap[deptUpper] || syllabusMap.CSE;

  return selectedSyllabus.map((ch, idx) => {
    const chNum = idx + 1;
    return {
      id: `ch-${chNum}`,
      title: ch.title,
      pageStart: chNum * 25 - 24,
      pageEnd: chNum * 25,
      content: `
        <div className="chapter-rendered-content">
          <h2 className="chapter-main-title">${ch.title}</h2>
          <p className="chapter-lead">
            Official academic textbook curriculum prescribed for <strong>${department}</strong> undergraduate and postgraduate engineering courses at DR. RVR NRI Institute of Technology.
          </p>

          <div className="chapter-summary-card">
            <h3>Key Learning Objectives & Syllabus Topics</h3>
            <ul>
              ${ch.topics.map(t => `<li><strong>${t}</strong>: Comprehensive theory, mathematical formulations, and practical engineering applications.</li>`).join('')}
            </ul>
          </div>

          <h3>1. Detailed Conceptual Analysis</h3>
          <p>
            In modern engineering and technical education, understanding <strong>${ch.topics[0]}</strong> provides the essential theoretical cornerstone. System modeling requires rigorous formulation of boundary conditions, state equations, and computational algorithmic workflows.
          </p>
          <p>
            Furthermore, <strong>${ch.topics[1]}</strong> enables engineers to design high-throughput, fault-tolerant solutions. Laboratory experimentation at NRI Institute of Technology emphasizes hands-on implementation using industry-standard simulation software and embedded testing benches.
          </p>

          <div className="formula-box">
            <h4>Fundamental Governing Equation</h4>
            <div className="math-display">
              \\( f(x) = \\int_{-\\infty}^{\\infty} \\Psi(t) e^{-i \\omega t} dt + \\nabla \\cdot \\mathbf{E} \\)
            </div>
            <p className="formula-caption">Figure ${chNum}.1: Generalized mathematical representation governing system behavior under dynamic operating conditions.</p>
          </div>

          <h3>2. Practical Implementation & Lab Exercises</h3>
          <p>
            Students are encouraged to execute the laboratory simulations provided in Appendix B. Pay specific attention to error margin constraints, frequency response characteristics, and power consumption metrics.
          </p>
          <p>
            Review questions at the end of this chapter align directly with JNTUK semester examination patterns and GATE competitive examination syllabi.
          </p>
        </div>
      `
    };
  });
}

export default generateRichChapters;
