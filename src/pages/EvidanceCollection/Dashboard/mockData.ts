import type {
  EvidenceCategory,
  EvidenceItem,
  EvidenceUser,
} from "./types";

export const mockEvidenceUsers: EvidenceUser[] = [
  {
    id: "u-1",
    name: "Aarav Mehta",
    role: "Quality Inspector",
    avatarUrl: "/images/user/user-11.jpg",
  },
  {
    id: "u-2",
    name: "Riya Patel",
    role: "Production Lead",
    avatarUrl: "/images/user/user-24.jpg",
  },
  {
    id: "u-3",
    name: "Kabir Shah",
    role: "Warehouse Supervisor",
    avatarUrl: "/images/user/user-19.jpg",
  },
  {
    id: "u-4",
    name: "Neha Iyer",
    role: "Vendor Auditor",
    avatarUrl: "/images/user/user-28.jpg",
  },
];

export const mockCurrentViewer = {
  id: "viewer-1",
  name: "You",
  role: "Evidence Reviewer",
};

export const mockEvidenceCategories: EvidenceCategory[] = [
  {
    id: "incoming",
    name: "Incoming Materials",
    children: [
      {
        id: "incoming-packaging",
        name: "Packaging",
        children: [
          { id: "incoming-packaging-labels", name: "Label Verification" },
          { id: "incoming-packaging-damage", name: "Damage Review" },
        ],
      },
      {
        id: "incoming-quantity",
        name: "Quantity Check",
        children: [
          { id: "incoming-quantity-counting", name: "Counting Bay" },
        ],
      },
    ],
  },
  {
    id: "production",
    name: "Production Floor",
    children: [
      {
        id: "production-assembly",
        name: "Assembly Line",
        children: [
          { id: "production-assembly-stage-1", name: "Stage 1" },
          { id: "production-assembly-stage-2", name: "Stage 2" },
        ],
      },
      {
        id: "production-quality",
        name: "Quality Checks",
        children: [
          { id: "production-quality-torque", name: "Torque Validation" },
          { id: "production-quality-finish", name: "Surface Finish" },
        ],
      },
    ],
  },
  {
    id: "dispatch",
    name: "Dispatch",
    children: [
      {
        id: "dispatch-packaging",
        name: "Final Packaging",
        children: [
          { id: "dispatch-packaging-seal", name: "Seal Verification" },
        ],
      },
      {
        id: "dispatch-loading",
        name: "Loading Bay",
        children: [
          { id: "dispatch-loading-truck", name: "Truck Handover" },
        ],
      },
    ],
  },
  {
    id: "vendor-audit",
    name: "Vendor Audit",
    children: [
      {
        id: "vendor-audit-site",
        name: "Site Visit",
        children: [
          { id: "vendor-audit-site-safety", name: "Safety Compliance" },
          { id: "vendor-audit-site-storage", name: "Storage Review" },
        ],
      },
    ],
  },
];

const buildComment = (
  id: string,
  userId: string,
  userName: string,
  userRole: string,
  message: string,
  createdAt: string,
) => ({
  id,
  userId,
  userName,
  userRole,
  message,
  createdAt,
});

export const mockEvidenceItems: EvidenceItem[] = [
  {
    id: "ev-1001",
    title: "Pallet labels matched against GRN batch",
    imageUrl: "/images/grid-image/image-01.png",
    description:
      "Front-facing capture of the incoming pallet after the barcode and GRN batch numbers were cross-checked.",
    categoryId: "incoming-packaging-labels",
    createdAt: "2026-03-31T09:20:00+05:30",
    userId: "u-1",
    likesCount: 18,
    likedByViewer: true,
    comments: [
      buildComment(
        "c-1001",
        "u-3",
        "Kabir Shah",
        "Warehouse Supervisor",
        "Clear enough to validate the lot sticker without zooming.",
        "2026-03-31T10:05:00+05:30",
      ),
    ],
  },
  {
    id: "ev-1002",
    title: "Outer carton dent inspection at dock",
    imageUrl: "/images/grid-image/image-02.png",
    description:
      "Minor impact marks noted on the right edge. Evidence kept for vendor claim reference and receiving note.",
    categoryId: "incoming-packaging-damage",
    createdAt: "2026-03-30T14:10:00+05:30",
    userId: "u-3",
    likesCount: 9,
    likedByViewer: false,
    comments: [
      buildComment(
        "c-1002",
        "u-1",
        "Aarav Mehta",
        "Quality Inspector",
        "No tear-through visible, but corner compression is clear.",
        "2026-03-30T14:40:00+05:30",
      ),
    ],
  },
  {
    id: "ev-1003",
    title: "Manual count tray before bin transfer",
    imageUrl: "/images/grid-image/image-03.png",
    description:
      "Operator count board and tray layout captured before the material moved into the assigned rack location.",
    categoryId: "incoming-quantity-counting",
    createdAt: "2026-03-29T11:45:00+05:30",
    userId: "u-2",
    likesCount: 14,
    likedByViewer: false,
    comments: [],
  },
  {
    id: "ev-1004",
    title: "Stage 1 gearbox bracket alignment",
    imageUrl: "/images/grid-image/image-04.png",
    description:
      "Fixture setup confirmed before fastening. The image highlights bracket seating and pin alignment.",
    categoryId: "production-assembly-stage-1",
    createdAt: "2026-03-28T16:25:00+05:30",
    userId: "u-2",
    likesCount: 27,
    likedByViewer: true,
    comments: [
      buildComment(
        "c-1004",
        "u-4",
        "Neha Iyer",
        "Vendor Auditor",
        "Useful reference for the next supplier calibration review.",
        "2026-03-28T17:00:00+05:30",
      ),
    ],
  },
  {
    id: "ev-1005",
    title: "Stage 2 cable routing snapshot",
    imageUrl: "/images/grid-image/image-05.png",
    description:
      "Captured after harness placement to document bend radius compliance and clamp spacing.",
    categoryId: "production-assembly-stage-2",
    createdAt: "2026-03-27T13:00:00+05:30",
    userId: "u-2",
    likesCount: 11,
    likedByViewer: false,
    comments: [],
  },
  {
    id: "ev-1006",
    title: "Torque wrench reading at validation station",
    imageUrl: "/images/grid-image/image-06.png",
    description:
      "Close-up shot showing the torque tool display after the final validation cycle completed.",
    categoryId: "production-quality-torque",
    createdAt: "2026-03-26T18:35:00+05:30",
    userId: "u-1",
    likesCount: 21,
    likedByViewer: true,
    comments: [
      buildComment(
        "c-1006",
        "u-3",
        "Kabir Shah",
        "Warehouse Supervisor",
        "The reading is visible even in thumbnail view.",
        "2026-03-26T18:50:00+05:30",
      ),
      buildComment(
        "c-1007",
        "u-2",
        "Riya Patel",
        "Production Lead",
        "Keeping this in the batch closure checklist.",
        "2026-03-26T19:10:00+05:30",
      ),
    ],
  },
  {
    id: "ev-1007",
    title: "Surface finish check under inspection light",
    imageUrl: "/assets/images/knowledge/image-2.jpg",
    description:
      "Oblique-angle image taken under inspection light to show the surface polish before dispatch approval.",
    categoryId: "production-quality-finish",
    createdAt: "2026-03-25T15:15:00+05:30",
    userId: "u-1",
    likesCount: 8,
    likedByViewer: false,
    comments: [],
  },
  {
    id: "ev-1008",
    title: "Seal applied to packed export carton",
    imageUrl: "/assets/images/lightbox1.jpg",
    description:
      "Final package photo with seal number and box markings visible for traceability before shipment release.",
    categoryId: "dispatch-packaging-seal",
    createdAt: "2026-03-24T12:30:00+05:30",
    userId: "u-3",
    likesCount: 16,
    likedByViewer: false,
    comments: [
      buildComment(
        "c-1008",
        "u-1",
        "Aarav Mehta",
        "Quality Inspector",
        "Seal number is readable, so this is good for audit evidence.",
        "2026-03-24T12:44:00+05:30",
      ),
    ],
  },
  {
    id: "ev-1009",
    title: "Loaded truck bay handover confirmation",
    imageUrl: "/assets/images/lightbox4.jpeg",
    description:
      "Exit gate capture showing truck number, loader signoff, and final pallet positioning before release.",
    categoryId: "dispatch-loading-truck",
    createdAt: "2026-03-23T19:05:00+05:30",
    userId: "u-3",
    likesCount: 13,
    likedByViewer: true,
    comments: [],
  },
  {
    id: "ev-1010",
    title: "Vendor site PPE compliance board",
    imageUrl: "/assets/images/knowledge/image-5.jpg",
    description:
      "Audit photo from the vendor floor entrance showing PPE requirements and active compliance signage.",
    categoryId: "vendor-audit-site-safety",
    createdAt: "2026-03-22T10:55:00+05:30",
    userId: "u-4",
    likesCount: 6,
    likedByViewer: false,
    comments: [],
  },
  {
    id: "ev-1011",
    title: "Raw material storage lane segregation",
    imageUrl: "/assets/images/knowledge/image-7.jpg",
    description:
      "Vendor audit reference for material segregation, rack labels, and aisle clearance around storage lanes.",
    categoryId: "vendor-audit-site-storage",
    createdAt: "2026-03-21T09:10:00+05:30",
    userId: "u-4",
    likesCount: 10,
    likedByViewer: false,
    comments: [
      buildComment(
        "c-1009",
        "u-2",
        "Riya Patel",
        "Production Lead",
        "Please keep this category for the quarterly audit packet.",
        "2026-03-21T10:00:00+05:30",
      ),
    ],
  },
];
