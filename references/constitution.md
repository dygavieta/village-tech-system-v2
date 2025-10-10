## 🧩 Code Quality, Testing Standards, User Experience Consistency, and Performance Requirements

- **Clean Code** — All code MUST be self-documenting with clear naming, minimal complexity (McCabe < 10), and adherence to the Single Responsibility Principle.  
- **Code Review** — All changes MUST pass peer review before merging; reviewers MUST verify constitutional compliance.  
- **Static Analysis** — All code MUST pass linting, type checking, and static analysis with zero warnings.  
- **Documentation** — Public APIs, complex algorithms, and architectural decisions MUST be documented inline and in design documents.  
- **No Dead Code** — Commented-out code, unused imports, and unreachable functions are forbidden; delete instead of commenting out.  
- **Testing Standards** — Enforce unit, integration, and end-to-end (E2E) tests across all modules with automated CI checks.  
- **User Experience Consistency** — Ensure a unified experience across all platforms, maintaining design alignment and predictable interaction patterns.  
- **Performance Requirements** — Optimize for speed, scalability, and stability, targeting under 2-second load times for all core operations.

---

## 💻 UX & Design Principles

- **Accessibility First** — Adhere to WCAG 2.1 AA compliance as the minimum standard.  
- **Mobile-First, Responsive Layouts** — Design interfaces that scale elegantly across all devices.  
- **Visual Hierarchy and Minimalism** — Prioritize clarity, readability, and simplicity in every layout.  
- **Design Tokens** — Use standardized spacing, color, and typography tokens for global consistency.  
- **Dark Mode Support** — Provide a fully functional dark theme for accessibility and comfort.  
- **Golden Ratio Application** — Apply proportional harmony in spacing and composition wherever applicable.  
- **Icon Consistency** — Use only icons from the approved library or package.

---

## ⚙️ Backend (Supabase) Principles

- **Security First** — Enforce Row-Level Security (RLS) and least privilege access for all data operations.  
- **Scalable Architecture** — Design databases and APIs to handle high concurrency and large datasets.  
- **Type Safety** — Use TypeScript consistently across all Supabase edge functions and backend logic.  
- **Optimized Data Modeling** — Apply normalized schema design for efficient and maintainable relationships.  
- **Performance Monitoring** — Continuously track query performance, caching efficiency, and response times.  
- **Modular Structure** — Organize functions and business logic into reusable, decoupled modules.  
- **Error Handling and Logging** — Implement structured logging, retries, and error boundaries for resilience.  
- **Continuous Integration/Deployment** — Automate tests, migrations, and versioning in all release workflows.  
- **Data Privacy and Compliance** — Adhere to local and international data protection standards (e.g., GDPR, DPA).

---

## 📱 Mobile (Flutter) Principles

- **Clean Architecture** — Follow MVVM or BLoC pattern for maintainable, testable codebases.  
- **Cross-Platform Consistency** — Maintain feature and visual parity across iOS, Android, and web.  
- **Responsive and Adaptive Layouts** — Ensure proper scaling for varying screen sizes and orientations.  
- **State Management** — Use consistent and scalable approaches (e.g., Riverpod, Provider, Bloc).  
- **Type Safety** — Implement null safety and type-safe Dart code across all modules.  
- **Performance Optimization** — Minimize widget rebuilds, reduce tree depth, and optimize rendering.  
- **Consistent Theming** — Apply shared design tokens for typography, color, and spacing.  
- **Offline Support** — Provide caching and graceful fallback behavior during connectivity loss.  
- **Accessibility Compliance** — Follow Flutter’s official accessibility guidelines.  
- **Automated Testing** — Integrate unit, widget, and integration tests within CI/CD workflows.