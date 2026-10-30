import { describe, expect, it } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { localizeTree } from "../components/Localization";
import { translateText } from "../lib/i18n/translate";

describe("English and Hindi presentation", () => {
  it("shows English by default and translates complete headings and validation messages", () => {
    expect(translateText("Kaunsa appliance bechna hai?", "en")).toBe("Which appliance would you like to sell?");
    expect(translateText("Which appliance would you like to sell?", "hi")).toBe("आप कौन-सा उपकरण बेचना चाहते हैं?");
    expect(translateText("Please upload at least one photo.", "hi")).toBe("कम से कम एक फ़ोटो अपलोड करें।");
    expect(translateText("2 new seller requests received. Team review and pricing are pending.", "hi")).toContain("2 नई बिक्री रिक्वेस्ट");
    expect(translateText("₹14,500 se shuru", "en")).toBe("From ₹14,500");
  });
  it("preserves canonical select values when the visible options change language", () => {
    const source = createElement("select", { name: "city", defaultValue: "Gonda" },
      createElement("option", null, "Lucknow"), createElement("option", null, "Gonda"));
    const output = renderToStaticMarkup(localizeTree(source, "hi"));
    expect(output).toContain('name="city"');
    expect(output).toContain('value="Gonda" selected="">गोंडा</option>');
    expect(output).toContain('value="Lucknow">लखनऊ</option>');
    expect(renderToStaticMarkup(source)).not.toContain("गोंडा");
  });
  it("keeps controlled field values, IDs, URLs and handlers unchanged", () => {
    const handler = () => {};
    const source = createElement("input", { name: "model", id: "model", value: "Washing Machine", placeholder: "Search appliances", onChange: handler });
    const translated = localizeTree(source, "hi") as ReactElement<Record<string, unknown>>;
    expect(translated.props.value).toBe("Washing Machine");
    expect(translated.props.name).toBe("model");
    expect(translated.props.id).toBe("model");
    expect(translated.props.onChange).toBe(handler);
    expect(translated.props.placeholder).toBe("उपकरण खोजें");
    const link = localizeTree(createElement("a", { href: "/products?category=Washing%20Machine" }, "Washing Machine"), "hi") as ReactElement<Record<string, unknown>>;
    expect(link.props.href).toBe("/products?category=Washing%20Machine");
    expect(link.props.children).toBe("वॉशिंग मशीन");
  });
  it("preserves private and user-written content including whitespace", () => {
    expect(translateText("  My own description\nwith a second line.  ", "hi")).toBe("  My own description\nwith a second line.  ");
    const description = createElement("p", { className: "seller-description" }, "Working well");
    expect(localizeTree(description, "hi")).toBe(description);
    const name = createElement("span", { translate: "no" }, "Home");
    expect(localizeTree(name, "hi")).toBe(name);
    const textarea = localizeTree(createElement("textarea", { name: "description", defaultValue: "Working well", placeholder: "Message *" }), "hi") as ReactElement<Record<string, unknown>>;
    expect(textarea.props.defaultValue).toBe("Working well");
    expect(textarea.props.placeholder).toBe("संदेश *");
  });
  it("keeps explicit status values stable and localizes accessible control labels", () => {
    const option = localizeTree(createElement("option", { value: "QUOTED" }, "Send team rate — keep listing private"), "hi") as ReactElement<Record<string, unknown>>;
    expect(option.props.value).toBe("QUOTED");
    expect(option.props.children).toContain("लिस्टिंग निजी रखें");
    const button = localizeTree(createElement("button", { "aria-label": "Remove photo 2" }, "Remove"), "hi") as ReactElement<Record<string, unknown>>;
    expect(button.props["aria-label"]).toBe("फ़ोटो 2 हटाएँ");
    expect(button.props.children).toBe("हटाएँ");
  });
});
