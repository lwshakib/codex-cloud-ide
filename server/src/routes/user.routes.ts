import { Router } from "express";
import { prisma } from "../services/prisma.services";
import { auth } from "../services/auth.services";
import { fromNodeHeaders } from "better-auth/node";

const router = Router();

// Middleware to check authentication
const authenticate = async (req: any, res: any, next: any) => {
  const session = await auth.api.getSession({ 
    headers: fromNodeHeaders(req.headers) 
  });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = session.user;
  next();
};

// Get current user's credits
router.get("/credits", authenticate, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { credits: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ credits: user.credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    res.status(500).json({ error: "Failed to fetch credits" });
  }
});

export default router;
