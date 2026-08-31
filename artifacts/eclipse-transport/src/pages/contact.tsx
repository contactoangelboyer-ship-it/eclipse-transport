import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSubmitContact } from "@workspace/api-client-react";
import { CheckCircle2, Loader2, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { ChatWidget } from "@/components/ChatWidget";
import { useSEO } from "@/hooks/useSEO";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  subject: z.string().optional(),
  message: z.string().min(10, "Please provide a detailed message"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  useSEO({
    title: "Contact Us — Luxury Car Service in Los Angeles",
    description: "Contact Eclipse Transport for luxury private car service in Los Angeles. Airport transfers, corporate travel, weddings & events. Available 24/7. Get a quote or make a reservation today.",
    keywords: "contact Eclipse Transport, luxury car service quote Los Angeles, book private driver LA, limousine reservation Los Angeles",
    canonical: "https://eclipsetransportla.com/contact",
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const submitContact = useSubmitContact();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data: ContactFormValues) => {
    submitContact.mutate({ data }, {
      onSuccess: () => {
        setIsSuccess(true);
        reset();
      }
    });
  };

  return (
    <Layout>
      {/* Quick Booking CTA */}
      <div className="bg-[#1A1A1A] text-white py-3 text-center px-4" data-testid="banner-quick-booking">
        <p className="text-sm font-medium tracking-wide">
          Need a ride right now? <a href="tel:6269774721" className="font-bold ml-1 hover:text-white/80 transition-colors underline decoration-white/30 underline-offset-2">Call (626) 977-4721</a>
        </p>
      </div>

      <div className="pt-24 pb-16 bg-[#FCFBF8]">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight text-[#1A1A1A]">Contact Us</h1>
          <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
            We are at your disposal. Connect with our dispatch team for inquiries, complex itineraries, or immediate assistance.
          </p>
        </div>
      </div>

      <div className="py-16 bg-white pb-32">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-16">
            
            {/* Contact Info */}
            <div className="space-y-16">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-6 border-b border-black/5 pb-4">Direct Communication</h2>
                <p className="text-[#1A1A1A]/70 leading-relaxed font-light text-lg">
                  Our dispatch operates 24/7 to ensure seamless service for our clients. Whether you need to arrange a last-minute transfer or coordinate a multi-day corporate event, our team is ready to assist.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 bg-[#FCFBF8] border border-black/5 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Phone className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-2">Phone</h3>
                    <a href="tel:6269774721" className="text-2xl md:text-3xl font-light text-[#1A1A1A] hover:text-black/60 transition-colors block">
                      (626) 977-4721
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 bg-[#FCFBF8] border border-black/5 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Mail className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-2">Email</h3>
                    <a href="mailto:Eclipsetransport995@gmail.com" className="text-lg md:text-xl font-light text-[#1A1A1A] hover:text-black/60 transition-colors block break-all">
                      Eclipsetransport995@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 bg-[#FCFBF8] border border-black/5 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <MapPin className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-2">Location</h3>
                    <p className="text-lg md:text-xl font-light text-[#1A1A1A]">Los Angeles, California</p>
                  </div>
                </div>

                {/* WhatsApp Button */}
                <div className="pt-4">
                  <a 
                    href="https://wa.me/16269774721" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex h-14 items-center justify-center bg-[#25D366] text-white px-8 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#20bd5a] transition-all hover:scale-105 shadow-md gap-3"
                    data-testid="button-whatsapp"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-[#FCFBF8] p-8 rounded-2xl border border-black/5">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-6">Business Hours</h3>
                <ul className="space-y-4 text-sm md:text-base text-[#1A1A1A]/80 font-light">
                  <li className="flex justify-between items-center border-b border-black/5 pb-4">
                    <span className="font-medium">Monday – Sunday</span>
                    <span>Available 24/7</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-black/5 pb-4">
                    <span className="font-medium">Dispatch</span>
                    <span>Always Open</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-medium">Reservations</span>
                    <span>6:00 AM – 11:00 PM</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-[#FCFBF8] border border-black/5 rounded-3xl p-8 md:p-12 shadow-sm h-fit">
              <h2 className="text-3xl font-light mb-8 text-[#1A1A1A] tracking-tight">Send an Inquiry</h2>
              
              {isSuccess ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-white border border-black/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <CheckCircle2 className="w-10 h-10 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-light tracking-tight mb-4 text-[#1A1A1A]">Message Sent</h3>
                  <p className="text-[#1A1A1A]/60 mb-10 font-light leading-relaxed">
                    Thank you for reaching out. A member of our team will be in touch shortly.
                  </p>
                  <Button 
                    onClick={() => setIsSuccess(false)}
                    variant="outline"
                    className="h-12 px-8 uppercase tracking-[0.2em] text-[10px] font-bold rounded-full border-black/10 hover:bg-black/5"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/60">Full Name</Label>
                      <Input id="name" {...register("name")} className={`h-12 bg-white border-black/10 focus-visible:ring-[#1A1A1A] ${errors.name ? "border-red-500" : ""}`} />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/60">Phone</Label>
                      <Input id="phone" type="tel" {...register("phone")} className={`h-12 bg-white border-black/10 focus-visible:ring-[#1A1A1A] ${errors.phone ? "border-red-500" : ""}`} />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/60">Email Address</Label>
                    <Input id="email" type="email" {...register("email")} className={`h-12 bg-white border-black/10 focus-visible:ring-[#1A1A1A] ${errors.email ? "border-red-500" : ""}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/60">Subject (Optional)</Label>
                    <Input id="subject" {...register("subject")} className="h-12 bg-white border-black/10 focus-visible:ring-[#1A1A1A]" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/60">Message</Label>
                    <Textarea 
                      id="message" 
                      className={`min-h-[160px] bg-white border-black/10 focus-visible:ring-[#1A1A1A] resize-none ${errors.message ? "border-red-500" : ""}`}
                      {...register("message")} 
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-[#1A1A1A] hover:bg-black text-white rounded-full uppercase tracking-[0.2em] text-[11px] font-bold transition-all shadow-md active:scale-[0.98]"
                    disabled={isSubmitting || submitContact.isPending}
                  >
                    {isSubmitting || submitContact.isPending ? (
                      <>
                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
            </div>
            
          </div>
        </div>
      </div>
      <ChatWidget />
    </Layout>
  );
}
