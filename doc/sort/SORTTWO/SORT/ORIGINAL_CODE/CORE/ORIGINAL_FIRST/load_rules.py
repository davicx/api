import importlib
import pkgutil


'''

def load_rules(package):
    """
    Discover rule modules in a package and return run() callables.

    Prefer ``core.rules.rule_engine.iter_ec2_rules()`` for EC2 (JSON + registry).
    Kept for ad-hoc / non-EC2 discovery.
    """
    rules = []
    for _, module_name, _ in pkgutil.iter_modules(package.__path__):
        module = importlib.import_module(f"{package.__name__}.{module_name}")
        if hasattr(module, "run"):
            rules.append(module.run)
    return rules
'''
