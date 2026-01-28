export interface User {
  id: string;
  email: string;
  name: string;
  type: "b2b" | "b2c";
}

// Mock user database
const mockUsers: User[] = [
  {
    id: "1",
    email: "demo@b2b.com",
    name: "Demo B2B User",
    type: "b2b",
  },
  {
    id: "2",
    email: "demo@b2c.com",
    name: "Demo B2C User",
    type: "b2c",
  },
];

// Mock authentication functions
export const mockAuth = {
  login: async (email: string, password: string, userType: "b2b" | "b2c") => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = mockUsers.find(
      (u) => u.email === email && u.type === userType,
    );

    if (!user || password !== "demo123") {
      throw new Error("Invalid credentials");
    }

    // Store in localStorage
    localStorage.setItem("mockUser", JSON.stringify(user));
    return user;
  },

  register: async (
    email: string,
    password: string,
    name: string,
    userType: "b2b" | "b2c",
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const newUser: User = {
      id: String(mockUsers.length + 1),
      email,
      name,
      type: userType,
    };

    mockUsers.push(newUser);
    localStorage.setItem("mockUser", JSON.stringify(newUser));
    return newUser;
  },

  loginWithGoogle: async (userType: "b2b" | "b2c") => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user: User = {
      id: "google-" + Date.now(),
      email: "google@example.com",
      name: "Google User",
      type: userType,
    };

    localStorage.setItem("mockUser", JSON.stringify(user));
    return user;
  },

  loginAsDemo: async (userType: "b2b" | "b2c") => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const demoUser = mockUsers.find((u) => u.type === userType);
    if (!demoUser) {
      throw new Error("Demo user not found");
    }

    localStorage.setItem("mockUser", JSON.stringify(demoUser));
    return demoUser;
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("mockUser");
    return userStr ? JSON.parse(userStr) : null;
  },

  logout: () => {
    localStorage.removeItem("mockUser");
  },
};
