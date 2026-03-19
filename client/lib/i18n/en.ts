export const en = {
  nav: {
    home: "HOME",
    collection: "COLLECTION",
    about: "ABOUT",
    contact: "CONTACT",

    // extra nav keys (from your 2nd block)
    admin: "ADMIN",
    search: "Search",
    notifications: "Notifications",
    profile: "Profile",
    signup: "Signup",
    wishlist: "Wishlist",
    openMenu: "Open menu",

    // profile dropdown keys (from your 1st block)
    orderTracking: "Order Tracking",
    orderHistory: "Order History",
    address: "Address",
    liveChat: "Live Agent Chat",
    myTickets: "My Support Tickets",
    raiseTicket: "Raise Support Ticket",
    language: "Language",
    deleteAccount: "Delete Account",
    logout: "Logout",
  },

  profile: {
    loading: "Loading profile…",
    back: "Back",
    title: "My Profile",
    personalInfo: "Personal Information",
    name: "Name",
    email: "Email",
    fitPreferences: "Fit Preferences",
    height: "Height (ft)",
    weight: "Weight (kg)",
    sizeRec: "Size Recommendation",
    menSize: "Men's Size",
    womenSize: "Women's Size",
    save: "Save Changes",
    saving: "Saving...",
    logout: "Logout",
    loggingOut: "Logging out...",

    ticketsTitle: "My Support Tickets",
    ticketsDesc: "See admin replies & chat",
    raiseTitle: "Raise Ticket",
    raiseDesc: "Create a new issue",

    dangerZone: "Danger Zone",
    dangerDesc:
      "Deleting your account will remove your profile access. This cannot be undone.",

    deleteBtn: "Delete Account",
    deleteModalTitle: "Delete your account?",
    deleteModalHint:
      'This will permanently disable your account (soft delete). To confirm, type "DELETE".',

    close: "Close",
    cancel: "Cancel",
    confirmDelete: "Confirm Delete",
    typeDelete: 'Type "DELETE"',
    mustTypeDelete: 'Please type "DELETE" to confirm.',

    updatedOk: "Profile updated successfully!",
    updateFail: "Update failed",
    tryAgain: "Something went wrong. Please try again.",
    deletedOk: "Your account has been deleted.",
    deleteFail: "Failed to delete account",
  },
} as const;