# **App Name**: EcoNexus

## Core Features:

- Role-Based Authentication: User authentication supporting Industrialist, Recycler, and Transporter roles via email/password and Google OAuth. Roles are stored in Firestore.
- Role-Based Dashboards: Role-based dashboards presenting tailored data views: waste submission for Industrialists, material inventory for Recyclers, and transport jobs for Transporters.
- Mapping & Location Services: Google Maps integration to visualize nearby recycling plants, calculate transport routes, and display distances between pickup and drop points.
- Waste Request Management: Waste requests management, enabling Industrialists to create and track waste requests; enabling Recyclers to list and manage their inventory.
- Real-time Notifications: FCM-powered push notifications for Recyclers upon new nearby waste requests and for Transporters upon new job availability.
- Image Upload: Allow users to upload photos of waste materials; these photos will be stored in Firebase storage and their URLs will be tracked in Firestore.

## Style Guidelines:

- Primary color: HSL 48, 97%, 60% (Hex: #FFFA75).  This vibrant yellow evokes a sense of optimism, cleanliness, and renewal. The hue is associated with environmental awareness and responsible practices.
- Background color: HSL 48, 25%, 95% (Hex: #F9F8F1). A desaturated tint of the primary to provide visual cohesion with good readability.
- Accent color: HSL 78, 60%, 45% (Hex: #6CBF44).  A vivid and attention-grabbing hue from the analogous side of the color wheel. Provides great contrast to the primary while carrying a natural feeling of life, health, growth, and ecosystems.
- Body and headline font: 'Inter', a grotesque-style sans-serif suitable for headlines or body text.
- Use consistent, modern-style line icons, emphasizing clarity and ease of understanding for waste types, transportation, and user roles.
- Clean, card-based layouts with sufficient whitespace to organize and prioritize information. Dashboards should be intuitive, directing users to key actions efficiently.
- Subtle transitions and loading animations to provide feedback and enhance the user experience during data updates and navigation.