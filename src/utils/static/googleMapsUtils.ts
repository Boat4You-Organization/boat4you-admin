export const generateGoogleMapsLink = (location: string): string => {
  const encodedLocation = encodeURIComponent(location);

  return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
};
